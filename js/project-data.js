import { fetchJSON } from "./utils.js";

// Share in-flight requests and completed content between repeated hovers.
const contentFiles = new Map();

export async function loadProjectContent(item) {
  if (!item.contentFile) return item;

  const url = item.contentFile;
  if (!contentFiles.has(url)) {
    const request = fetchJSON(url).then(data => {
      if (typeof data?.id !== "string" || !Array.isArray(data.content)) {
        throw new Error(`Invalid project content: ${url}`);
      }
      return data;
    }).catch(error => {
      contentFiles.delete(url);
      throw error;
    });
    contentFiles.set(url, request);
  }

  const data = await contentFiles.get(url);
  if (data.id !== item.id) {
    contentFiles.delete(url);
    throw new Error(`Project ID mismatch: ${url}`);
  }
  return { ...item, content: data.content };
}
