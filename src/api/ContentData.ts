import Size from '../util/Size';
import ContentSource from './ContentSource';
import ContentType from './ContentType';

const createImage = async (url: string) => new Promise<HTMLImageElement | undefined>((res, rej) => {
  const image = new Image();
  image.onload = () => res(image);
  image.onerror = () => res(undefined);
  image.src = url;
});

const createVideo = async (url: string) => new Promise<HTMLVideoElement | undefined>((res, rej) => {
  var video = document.createElement("video");
  video.onloadeddata = () => res(video);
  video.onerror = () => res(undefined);
  video.src = url;
});

type OnContentDataLoaded = (err: string | undefined, url: string | undefined) => void;

class ContentData {
  readonly contentSource: ContentSource;
  private objectUrl: string | undefined;
  private type: ContentType | undefined;
  private duration: number = 0;
  private size: Size = new Size(0, 0);
  private state: 'new' | 'loading' | 'loaded' = 'new';
  private onLoaded: OnContentDataLoaded[] = [];
  

  constructor(contentSource: ContentSource) {
    this.contentSource = contentSource;
  }

  getType() {
    return this.type;
  }
  
  private getUrl() {
    if (!this.objectUrl) {
      this.objectUrl = this.contentSource.getObjectUrl();
    }
    return this.objectUrl;
  }

  cleanup() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.objectUrl = undefined;
  }

  getDuration() {
    return this.duration;
  }

  getSize() {
    return this.size;
  }

  isLoaded() {
    return this.state === 'loaded';
  }

  load(onLoad: OnContentDataLoaded) {
    if (this.state === 'loaded') {
      this.callOnLoad(onLoad);
    } else {
      this.onLoaded.push(onLoad);
      if (this.state === 'new') {
        this.doLoad();
      }
    }
  }

  cancelLoad(onLoad: OnContentDataLoaded) {
    const index = this.onLoaded.indexOf(onLoad);
    if (index >= 0) {
      this.onLoaded.splice(index, 1);
    }
    if (!this.onLoaded.length) {
      this.cleanup();
    }
  }

  private async doLoad() {
    if (this.state !== 'new') return;
    this.state = 'loading';
    const image = await createImage(this.getUrl());
    if (image) {
      this.type = ContentType.Image;
      this.size = new Size(image.naturalWidth, image.naturalHeight);
    } else {
      const video = await createVideo(this.getUrl());
      if (video) {
        this.duration = video.duration;
        this.type = ContentType.Video;
        this.size = new Size(video.videoWidth, video.videoHeight);
      }
    }
    this.handleLoaded();
  }

  private handleLoaded = () => {
    this.state = 'loaded';
    this.onLoaded.forEach(this.callOnLoad);
  };
  
  private callOnLoad = (onLoad: OnContentDataLoaded) => {
    if (this.type) {
      onLoad(undefined, this.getUrl());
    } else {
      onLoad('Was not a supported image or video', undefined);
    }
  }

}

export default ContentData;
