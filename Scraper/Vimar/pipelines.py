
import os, json, ocrmypdf, re, logging
from scrapy.pipelines.files import FilesPipeline

from supabase import create_client, Client
from pypdf import PdfReader
from langdetect import detect
from langchain_text_splitters import RecursiveCharacterTextSplitter

logging.basicConfig(level=logging.INFO)
#from itemadapter import ItemAdapter

class CustomFilePipeline(FilesPipeline):
    def file_path(self, request, response=None, info=None, *, item=None):
        return request.url.split('/')[-1]
    

class DBPipeline(object):
    def open_spider(self, spider):
        url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        self.supabase: Client = create_client(url, key)
        
    def close_spider(self, spider): 
        pass

    def process_item(self, item, spider):
        try:
            self._addProduct(item['ID'], item['Nome'], item['Descrizione'], item['ETIM'], item['Faq'])
            #PDF
            for pdf in item['files']:
                # OCR
                self._makeOcr(pdf)
                # UPLOADING
                objID = self._uploadPDF(f'pdfs/{pdf['path']}')
                if objID:
                    print(f'objID: {objID}')
                    self._addPDF(pdf['url'], pdf['path'].split('/')[-1], objID)
                    self._mergePdfProduct(item['ID'], pdf['url'])
                else:
                    spider.log(f"Failed to upload PDF {pdf['path']}")

            #FAQ
            for faq in item['Faq']:
                self._addFaq(item['ID'], faq['question'], faq['answer'])

        except Exception as e:
            spider.log(f"Failed FAQ item into DB: {e}")
        return item
        
    
    def _addProduct(self, ID, Nome, Descrizione, ETIM, Faq):
        try:
            response = self.supabase.table('prodotto').upsert({
                'id': ID,
                'nome': Nome,
                'descrizione': Descrizione,
                'etim': json.dumps(ETIM)
                
            }).execute()
            if response.data:
                logging.info(f"Upserted product {ID}")
            else:
                logging.error(f"Failed to upsert product {ID}")
        except Exception as e:
            logging.error(f"Failed to upsert product into DB: {e}")

    def _uploadPDF(self, pathFile):
        try:
            with open(pathFile, 'rb') as f:
                response = self.supabase.storage.from_('files').upload(
                    pathFile, f, {'upsert':'true'}
                )
                if response:
                    logging.info(f"File uploaded successfully: {response}")
                    files = self.supabase.storage.from_('files').list(f'pdfs')
                    for file in files:
                        if file['name'] == pathFile.split('/')[-1]:
                            return file['id']
                    
                else:
                    logging.error(f"Failed to upload PDF {pathFile}")
            return None
        except Exception as e:
            logging.error(f"Failed to upload pdf into DB: {e}")

    def _addPDF(self, url, title, objID):
        try:
            response = self.supabase.table('manuale').upsert({
                'link': url,
                'nome': title,
                'storage_object_id': objID
            }).execute()
            if response.data:
                logging.info(f"Upserted PDF {url}")
            else:
                logging.error(f"Failed to upsert PDF {url}")
        except Exception as e:
            logging.error(f"Failed to insert pdf into DB: {e}")

    def _mergePdfProduct(self, ID, url):
        try:
            response = self.supabase.table('prodotto_manuale').upsert({
                'prodotto': ID,
                'manuale': url
            }).execute()
            if response.data:
                logging.info(f"Upserted product {ID} with PDF {url}")
            else:
                logging.error(f"Failed to upsert product {ID} with PDF {url}")
        except Exception as e:
            logging.error(f"Failed to merge pdf with product: {e}")

    def _addFaq(self, product_id, question, answer):
        try:
            response = self.supabase.table('qea').upsert({
                'prodotto': product_id,
                'domanda': question,
                'risposta': answer
            }).execute()
            if response.data:
                logging.info(f"Upserted FAQ for product {product_id}")
            else:
                logging.error(f"Failed to upsert FAQ for product {product_id}")
        except Exception as e:
            logging.error(f"Failed to insert FAQ into DB: {e}")
        
    def _makeOcr(self, pdf):
        inputFile = f'pdfs/{pdf['path']}'
        outputFile = f"{inputFile}_temp.pdf"
        try:
            ocrmypdf.ocr(inputFile, outputFile, language='ita')
            os.remove(inputFile)
            os.rename(outputFile, inputFile)
            logging.info(f"OCR completed successfully: {inputFile}")
        except Exception as e:
            logging.error(f"Failed to make OCR: {e}")

class ChunkingPipeline(object):
    def open_spider(self, spider):
        url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        self.supabase: Client = create_client(url, key)

    def process_item(self, item, spider):
        try:
            for pdf in item['files']:
                path = f'pdfs/{pdf['path']}'
                url = pdf['url']

                #check if the file is a pdf
                if '.pdf' not in path:
                    break
                reader = PdfReader(path)

                #check if the pdf is already chunked
                if self._isChunked(url):
                    break

                pages = []
                for page in reader.pages:
                    pages.append(page.extract_text())
                
                chunks = self._chunking(pages)

                for i, chunk in enumerate(chunks):
                    self._addChunk(url, i, chunk)
        
        except Exception as e:
            spider.log(f"Failed to insert item into DB: {e}")
    
    def _isChunked(self, url):
        try:
            response = self.supabase.table("manuale_sezione").select("*").eq("manuale", f'{url}').execute()
            if response.data:
                return True
            return False
        except Exception as e:
            logging.error(f"Failed to check if PDF is chunked: {e}")
            return False

    def _chunking(self, pages):
        split = []
        for page in pages:
            for chunk in page.split(r'\.\n'):
                if self._isIta(chunk):
                    split.append(chunk)
        txt = ' '.join(split)

        split = self._backslashSplit(txt)
        split = self._removeHigh_(split)
        txt = ' '.join(split)
        txt = self._removeOtherSpecial(txt)

        text_splitter = RecursiveCharacterTextSplitter(chunk_size = 800, chunk_overlap = 100)

        return text_splitter.split_text(txt)
        
    def _addChunk(self, url, number, text):
        try:
            response = self.supabase.table('manuale_sezione').upsert({
                'manuale': url,
                'nchunk': number,
                'contenuto': text
            }).execute()
            if response.data:
                logging.info(f"Upserted chunk for PDF {url}")
            else:
                logging.error(f"Failed to upsert chunk for PDF {url}")
        except Exception as e:
            logging.error(f"Failed to insert chunk into DB: {e}")

    # function to split the text into chunks

    def _removeOtherSpecial(self, text):
        cleaned_text = re.sub(r'[\|•\t]', ' ', text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
        return cleaned_text.strip()


    def _backslashSplit(self, document: str)->list:
        chunk = re.split(r'\n', document)
        return chunk


    def _removeHigh_ (self, lista:list)->list:
        new_list = []
        for i in range(len(lista)):
            elem = lista[i]
            if elem[-1] == '-':
                new_list.append(elem[:-1])
            else:
                new_list.append(elem)         
        return new_list


    def _isIta(self, text):
        try:
            return detect(text) == 'it'
        except:
            return False