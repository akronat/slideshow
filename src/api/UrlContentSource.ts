import ContentSource from './ContentSource';

class UrlContentSource implements ContentSource {
  url: string;
  id: string;
  name: string;

  constructor(url: string) {
    this.id = url;
    this.name = url;
    this.url = url;
  }
  
  getObjectUrl() {
    return this.url;
  }
}

export const getUrlContentSource = (url: string): UrlContentSource => {
    return new UrlContentSource(url);
};
