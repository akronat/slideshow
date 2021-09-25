import ContentSource from './ContentSource';

class FileContentSource implements ContentSource {
  file: File;
  id: string;
  name: string;

  constructor(id: string, file: File) {
    this.id = id;
    this.name = file.name;
    this.file = file;
  }
  
  getObjectUrl() {
    return URL.createObjectURL(this.file);
  }
}

export const getFileEntryContentSource = async (fileEntry: FileEntry): Promise<FileContentSource> => {
    const file = await new Promise<File>((res, rej) => fileEntry.file(res, e => rej(`Error accessing file ${fileEntry.name}: ${e}`)));
    return getFileContentSource(file);
};

export const getFileContentSource = (file: File): FileContentSource => {
    return new FileContentSource(`${file.name}:${file.size}`, file);
};
