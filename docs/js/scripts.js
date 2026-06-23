document.addEventListener("DOMContentLoaded", function() {
    const toc = document.getElementById("page-toc");
    if (!toc) return;

    const headings = document.querySelectorAll("#main-content h2, #main-content h3");
    if (headings.length === 0) {
        toc.style.display = "none";
        return;
    }

    // Helper: create a URL-friendly ID from text
    function slugify(text) {
        return text
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+|-+$/g, '');       // Trim - from start and end
    }

    let idCounter = 0;
    const usedIds = new Set();

    headings.forEach(heading => {
        if (!heading.id) {
            let baseId = slugify(heading.textContent);
            let finalId = baseId;

            // Ensure uniqueness
            while (usedIds.has(finalId) || document.getElementById(finalId)) {
                finalId = `${baseId}-${++idCounter}`;
            }

            heading.id = finalId;
            usedIds.add(finalId);
        } else {
            usedIds.add(heading.id);
        }
    });

    // Build nested TOC
    const mainUl = document.createElement("ul");
    let currentH2Li = null;
    let currentSubUl = null;

    headings.forEach(heading => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        li.appendChild(a);

        if (heading.tagName === "H2") {
            mainUl.appendChild(li);
            currentH2Li = li;
            currentSubUl = null;
        } else if (heading.tagName === "H3") {
            if (!currentSubUl && currentH2Li) {
                currentSubUl = document.createElement("ul");
                currentH2Li.appendChild(currentSubUl);
            }

            if (currentSubUl) {
                currentSubUl.appendChild(li);
            } else {
                mainUl.appendChild(li); // fallback
            }
        }
    });

    toc.appendChild(mainUl);
});
