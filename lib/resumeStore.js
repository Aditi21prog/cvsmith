const globalForResume = global;

if (!globalForResume.resumeStore) {
  globalForResume.resumeStore = new Map();
}

export const resumeStore = globalForResume.resumeStore;
