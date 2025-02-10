import scrapy

class ProductItem(scrapy.Item):
    ID = scrapy.Field()
    Nome = scrapy.Field()
    Descrizione = scrapy.Field()
    PDFs = scrapy.Field()
    ETIM = scrapy.Field()
    Faq = scrapy.Field()
    pendingRequest = scrapy.Field()
    files_urls = scrapy.Field()
    files = scrapy.Field()
