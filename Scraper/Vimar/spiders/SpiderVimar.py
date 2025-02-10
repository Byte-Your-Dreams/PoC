import scrapy
from Vimar.items import ProductItem
class SpiderVimar(scrapy.Spider):
    name = "SpiderVimar"

    def start_requests(self):
        urls = [
            "https://www.vimar.com/it/it/catalog/product/index/liv/A0L102?page=1",
            #"https://www.vimar.com/it/it/catalog/product/index/liv/B0L110?page=1"
            ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self._navigation)

    def _navigation(self, response):
        startingURL="https://www.vimar.com"

        #getting to every product page
        for product in self._getLinkToProducts(response):
            #self.log(f"Following product link: {product}", level=logging.DEBUG)  # Log the product link being followed
            yield response.follow(startingURL+product, callback=self._parseProduct)

        #getting to the next page
        #nextPage = self._getlinkNextPage(response.body)
        #if(nextPage):
        #   yield scrapy.Request(url=startingURL+nextPage, callback= self._navigation)

    # ------------------- PARSING -------------------
    def _parseProduct(self, response):
        item = ProductItem()
        #id, name, description
        tmp = response.css('div#catalog-detail div div p')
        item['ID'] = self._getId(tmp)
        item['Nome'] = self._getName(tmp)
        item['Descrizione'] = self._getDescription(tmp)

        #self.log(f"Parsed product ID: {item['ID']}", level=logging.DEBUG)  # Log the parsed product ID
        #self.log(f"Parsed product Name: {item['Nome']}", level=logging.DEBUG)  # Log the parsed product Name
        #self.log(f"Parsed product Description: {item['Descrizione']}", level=logging.DEBUG)  # Log the parsed product Description

        #saving etim data
        item['ETIM'] = self._getEtim(response.css('div#pills-etim div div'))
        #self.log(f"ETIM data: {item['ETIM']}", level=logging.DEBUG)  # Log the ETIM data

        #saving questions and answers
        item['Faq'] = self._getFaq(response.css('#pills-faq'))

        #downloading pdfs
        item['files_urls'] = self._getPDFs(response.css('div#pills-download h4:contains("Istruzioni, Manuali, Documentazione") + ul li'))
        #self.log(f"PDFs to download: {item['files_urls']}", level=logging.DEBUG)  # Log the PDFs to download
            
        yield item

    # ------------------- GETTERS -------------------
    def _getId(self, response):
        return response.css('strong::text')[0].get()
    
    def _getName(self, response):
        return response.css('strong::text')[1].get()
    
    def _getDescription(self, response):
        return response.css('p::text')[1].get()
    
    def _getEtim(self, response):
        etim= {}
        for item in response:
            key = item.css('strong::text').get().strip()
            value = item.css('::text').getall()[-1].strip()
            etim[key] = value
        return etim

    def _getPDFs(self, response):
        pdfs = []
        for item in response:
            link = item.css('a::attr(href)').get()
            if 'IT' in link:
                pdfs.append(link)
        return pdfs
    
    def _getFaq(self, response):
        faq = []

        questions = response.css('td.pb-0::text').getall()
        answers = response.css('td.pt-0::text').getall()

        for question, answer in zip(questions, answers):
            faq.append({
                'question': question.strip(),  # Rimuove spazi inutili
                'answer': answer.strip()       # Rimuove spazi inutili
            })
        return faq

    def _getLinkToProducts(self, response):
        return response.css('div[data-catalog-namespace="catalog/product"]::attr(data-catalog-url)').getall()

    def _getlinkNextPage(self, response):
        current_page = response.css('li.page-item.active::attr(data-page)').get()
        next_page = str(int(current_page) + 1)
        return response.css(f'li.page-item[data-page="{next_page}"] a.page-link::attr(href)').get()
