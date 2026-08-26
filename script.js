const browser = document.getElementById('browser');

async function loadTree() {
    try {
        const response = await fetch('/api/tree');

        if (!response.ok) {
            throw new Error('Could not load project tree.');
        }

        const tree = await response.json();

        browser.innerHTML = '';

        const list = document.createElement('div');
        list.className = 'list-group';

        tree.forEach((item) => {
            list.appendChild(createItem(item));
        });

        browser.appendChild(list);
    } catch (error) {
        browser.innerHTML = `
                        <div class="alert alert-danger">
                            ${escapeHtml(error.message)}
                        </div>
                    `;
    }
}

function createItem(item) {
    if (item.type === 'directory') {
        return createFolder(item);
    }

    return createFile(item);
}

function createFolder(item) {
    const wrapper = document.createElement('div');

    wrapper.className = 'list-group-item';

    const button = document.createElement('button');

    button.type = 'button';
    button.className =
        'btn btn-link text-dark text-decoration-none ' + 'w-100 text-start p-0';

    button.innerHTML = `
                    <div class="d-flex align-items-center gap-3">
                        <span class="fs-4 folder-icon">📁</span>

                        <div class="flex-grow-1">
                            <div class="fw-semibold">
                                ${escapeHtml(item.name)}
                            </div>

                            <small class="text-secondary">
                                Folder
                            </small>
                        </div>

                        <span class="arrow text-secondary">
                            ›
                        </span>
                    </div>
                `;

    const children = document.createElement('div');

    children.className = 'd-none mt-3 ms-4';

    item.children.forEach((child) => {
        children.appendChild(createItem(child));
    });

    button.addEventListener('click', () => {
        const isClosed = children.classList.contains('d-none');

        children.classList.toggle('d-none', !isClosed);

        button.querySelector('.arrow').textContent = isClosed ? '⌄' : '›';
    });

    wrapper.appendChild(button);
    wrapper.appendChild(children);

    return wrapper;
}

function createFile(item) {
    const link = document.createElement('a');

    link.href = '/' + item.path.replaceAll('\\', '/');

    link.className = 'list-group-item list-group-item-action';

    link.innerHTML = `
                    <div class="d-flex align-items-center gap-3">
                        <span class="fs-4">📄</span>

                        <div>
                            <div class="fw-semibold">
                                ${escapeHtml(item.name)}
                            </div>

                            <small class="text-secondary">
                                File
                            </small>
                        </div>
                    </div>
                `;

    return link;
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

loadTree();
