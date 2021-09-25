
const fetchUrlMimeType = async (url: string): Promise<string> => {
  return new Promise((res, rej) => {
    var xhttp = new XMLHttpRequest();
    xhttp.open('HEAD', url);
    xhttp.onerror = () => rej(`An error loading the URL ${url}`);
    xhttp.onreadystatechange = function () {
        if (this.readyState === this.DONE) {
            // console.log(this.status);
            const type = this.getResponseHeader("Content-Type");
            if (type) {
              res(type);
            } else {
              rej(`Couldn't get content type for URL ${url}`);
            }
        }
    };
    xhttp.send();
  });
};

export default fetchUrlMimeType;
