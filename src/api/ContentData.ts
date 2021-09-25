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

  isLoaded() {
    return this.state === 'loaded';
  }

  load(onLoad: OnContentDataLoaded) {
    if (this.state !== 'loaded') {
      this.onLoaded.push(onLoad);
      this.doLoad().then(this.handleLoaded, this.handleLoaded);
    } else {
      this.callOnLoad(onLoad);
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
    if (await createImage(this.getUrl())) {
      this.type = ContentType.Image;
    } else {
      const video = await createVideo(this.getUrl());
      if (video) {
        this.duration = video.duration;
        this.type = ContentType.Video;
      }
    }
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
