let editor;
let currentFile = null;

// File System Manager
class FileSystem {
    constructor() {
        this.storageKey = 'theta-files';
        this.structure = this.loadStructure();
    }

    loadStructure() {
        const defaultStructure = {
            name: 'root',
            type: 'folder',
            children: []
        };
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : defaultStructure;
    }

    saveStructure() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.structure));
        this.renderFileTree();
    }

    createFile(path, content = '') {
        const parts = path.split('/');
        const fileName = parts.pop();
        let current = this.structure;

        for (const part of parts) {
            let folder = current.children.find(c => c.name === part && c.type === 'folder');
            if (!folder) {
                folder = { name: part, type: 'folder', children: [] };
                current.children.push(folder);
            }
            current = folder;
        }

        current.children.push({
            name: fileName,
            type: 'file',
            content,
            path: path
        });
        this.saveStructure();
    }

    deleteAll() {
        localStorage.removeItem(this.storageKey);
        this.structure = this.loadStructure();
        this.saveStructure();
    }

    renderFileTree() {
        const container = document.getElementById('file-tree');
        container.innerHTML = '';
        this.renderNode(this.structure, container);
    }

    renderNode(node, container, depth = 0) {
        const element = document.createElement('div');
        element.className = node.type === 'folder' ? 'folder' : 'file-item';
        element.style.paddingLeft = `${depth * 20}px`;
        element.innerHTML = `
            <span>${node.type === 'folder' ? '📁' : '📄'} ${node.name}</span>
            ${node.type === 'file' ? `<button onclick="deleteFile('${node.path}')">🗑️</button>` : ''}
        `;

        if (node.type === 'folder') {
            element.addEventListener('click', () => this.toggleFolder(node, element));
            const childrenContainer = document.createElement('div');
            childrenContainer.style.display = 'none';
            node.children.forEach(child => this.renderNode(child, childrenContainer, depth + 1));
            element.appendChild(childrenContainer);
        } else {
            element.addEventListener('click', () => this.openFile(node));
        }

        container.appendChild(element);
    }

    toggleFolder(node, element) {
        const children = element.querySelector('div');
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
    }

    openFile(file) {
        currentFile = file.path;
        editor.setValue(file.content);
        document.getElementById('file-path').textContent = file.path;
    }
}

// ThetaCode Runner
class ThetaCodeRunner {
    constructor() {
        this.bots = new Map();
    }

    run(code) {
        try {
            const output = [];
            const lines = code.split('\n').filter(l => l.trim());
            
            lines.forEach(line => {
                if (line.startsWith('create bot')) {
                    const [, name, platform] = line.match(/create bot "(.*?)" platform "(.*?)"/);
                    this.bots.set(name, { platform, status: 'active' });
                    output.push(`🤖 Created ${platform} bot: ${name}`);
                }
                else if (line.startsWith('on')) {
                    const [, botName, trigger, response] = line.match(/on (.*?) receives "(.*?)" respond with "(.*?)"/);
                    output.push(`🔗 ${botName} will respond to "${trigger}"`);
                }
                else if (line.startsWith('print')) {
                    const [, message] = line.match(/print "(.*?)"/);
                    output.push(`📢 ${message}`);
                }
            });

            return { success: true, output: output.join('\n') };
        } catch (error) {
            return { success: false, error: `🚨 Error: ${error.message}` };
        }
    }
}

// UI Components
class Dialog {
    static show() {
        document.getElementById('confirm-dialog').style.display = 'flex';
    }

    static hide() {
        document.getElementById('confirm-dialog').style.display = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Monaco Editor
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
    require(['vs/editor/editor.main'], () => {
        editor = monaco.editor.create(document.getElementById('editor'), {
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 24
        });
    });

    // Initialize File System
    window.fileSystem = new FileSystem();
    window.fileSystem.renderFileTree();
});

// Global Functions
function createFile() {
    const path = prompt('Enter file path (e.g., src/main.tc):');
    if (path) fileSystem.createFile(path);
}

function createFolder() {
    const path = prompt('Enter folder path (e.g., src/utils):');
    if (path) fileSystem.createFile(`${path}/.keep`, '');
}

function deleteFile(path) {
    if (confirm(`Delete ${path}?`)) {
        // Implement file deletion logic
    }
}

function deleteAllFiles() {
    fileSystem.deleteAll();
    editor.setValue('');
    Dialog.hide();
    showOutput('All files deleted successfully');
}

function showConfirmDialog() {
    Dialog.show();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function runCode() {
    const runner = new ThetaCodeRunner();
    const result = runner.run(editor.getValue());
    showOutput(result.output || result.error);
}

function showOutput(message) {
    document.getElementById('output').textContent = message;
}

function clearOutput() {
    document.getElementById('output').textContent = '';
}
