import ContentSource from './ContentSource';

class FileContentSource implements ContentSource {
  file: File;
  id: string;
  isAccessable: boolean;

  constructor(id: string, file: File, isAccessable: boolean) {
    this.file = file;
    this.id = id;
    this.isAccessable = isAccessable;
  }

  async loadData(): Promise<string> {
    return new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = async e => {
        if (e.target?.result && typeof e.target.result === 'string') {
          res(e.target.result);
        } else {
          rej(`Failed to read valid data from ${this.file.name}.`);
        }
      }
      reader.onerror = e => rej(`Error reading ${this.file.name}: ${e.target?.error}`);
      reader.readAsDataURL(this.file);
    });
  }
}

export const getFileEntryContentSource = async (fileEntry: FileEntry): Promise<FileContentSource> => {
    const file = await new Promise<File>((res, rej) => fileEntry.file(res, e => rej(`Error accessing file ${fileEntry.name}: ${e}`)));
    return getFileContentSource(file);
};

export const getFileContentSource = (file: File): FileContentSource => {
    return new FileContentSource(btoa(`${file.name}:${file.size}`), file, true);
};
