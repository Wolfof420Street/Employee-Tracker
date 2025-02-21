import { County, PaginatedResponse } from "./interfaces";

export const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    return res.json();
  });

  export const countiesFetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch counties");
    }
    const data = await res.json();
    return data as PaginatedResponse<County>;
  });

  export const subCountiesFetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch counties");
    }
    const data = await res.json();
    return data.data; // Extract the `data` key
  });

  
