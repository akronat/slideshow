
export default interface ContentSource {
  id: string;
  loadData: () => Promise<string>;
}
