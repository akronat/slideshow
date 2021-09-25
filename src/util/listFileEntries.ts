
const listFileEntries = async (...fileEntries: Entry[]): Promise<FileEntry[]> => {
  return (await Promise.all(fileEntries.map((fileEntry): Promise<any> | any => {
    if (fileEntry.isFile) {
      return fileEntry;
    } else if (fileEntry.isDirectory) {
      return new Promise<FileEntry[]>((res, rej) => {
        (fileEntry as DirectoryEntry).createReader().readEntries(
          (entries: any[]) => res(listFileEntries(...entries)),
          (error: any) => rej(error),
        );
      });
    }
    return [];
  }))).flat();
};

export default listFileEntries;
