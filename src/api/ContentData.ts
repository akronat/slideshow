import ContentSource from './ContentSource';
import ContentType from './ContentType';

const createImage = async (fileData: string) => new Promise<HTMLImageElement | undefined>((res, rej) => {
  const image = new Image();
  image.onload = () => res(image);
  image.onerror = () => res(undefined);
  image.src = fileData;
});

const createVideo = async (fileData: string) => new Promise<HTMLVideoElement | undefined>((res, rej) => {
  var video = document.createElement("video");
  video.onloadeddata = () => res(video);
  video.onerror = () => res(undefined);
  video.src = fileData;
});

class ContentData {
  contentSource: ContentSource;
  data: string | undefined;
  type: ContentType | undefined;
  length: number = 0;
  isLoaded: boolean = false;
  onLoaded: (() => void) | undefined;
  

  constructor(contentSource: ContentSource) {
    this.contentSource = contentSource;
  }

  async load() {
    this.data = await this.contentSource.loadData();
    if (await createImage(this.data)) {
      this.type = ContentType.Image;
    } else {
      const video = await createVideo(this.data);
      if (video) {
        this.length = video.duration;
        this.type = ContentType.Video;
      }
    }
  }

}

export default ContentData;
