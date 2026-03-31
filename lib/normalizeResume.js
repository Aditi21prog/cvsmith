export function normalizeResume(resume) {

  return {
    meta: resume.meta || {},
    sections: (resume.sections || []).map(sec => {

      return {

        title:
          sec.title ||
          sec.heading ||
          sec.name ||
          "",

        content:
          sec.content ||
          sec.summary ||
          sec.text ||
          "",

        items:
          sec.items ||
          sec.bullets ||
          sec.data ||
          []

      };

    })
  };
}
