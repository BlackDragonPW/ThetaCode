// theta.js
let editor;
let currentFile = null;

// VS Code-like Keybindings
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
});

// File System (LocalStorage-based)
const fileSystem = {
    getStructure: () => JSON.parse(localStorage.getItem('vscode-files') || {
        name: 'workspace',
        children: []
    },
    
    saveFile: (path, content) => {
        const parts = path.split('/');
        let current = fileSystem.getStructure();
        
        parts.forEach((part, index) => {
            if(index === parts.length - 1) {
                current.children.push({
                    name: part,
                    type: 'file',
                    content: content,
                    path: path
                });
            } else {
                let folder = current.children.find(c => c.name === part && c.type === 'folder');
                if(!folder) {
                    folder = { name: part, type: 'folder', children: [] };
                    current.children.push(folder);
                }
                current = folder;
            }
        });
        
        localStorage.setItem('vscode-files', JSON.stringify(current));
    },

    deleteAll: () => {
        localStorage.removeItem('vscode-files');
        editor.setValue('');
        updateFileTree();
    }
};

// Monaco Editor Setup
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'thetacode',
        theme: 'vs-dark',
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        roundedSelection: false,
        padding: { top: 10 },
        lineNumbers: 'on',
        contextmenu: false,
        fontSize: 14,
        lineHeight: 24,
        renderLineHighlight: 'all'
    });
    
    // Track cursor position
    editor.onDidChangeCursorPosition(e => {
        document.querySelector('.line-info').textContent = 
            `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });
});

// ThetaCode Language
monaco.languages.register({ id: 'thetacode' });
monaco.languages.setMonarchTokensProvider('thetacode', {
    keywords: [
        'create', 'bot', 'platform', 'api_code', 'on', 'receives', 'respond', 
        'with', 'deploy', 'print', 'load', 'data', 'from', 'filter', 'where'
    ],
    tokenizer: {
        root: [
            [/"(?:[^"\\]|\\.)*"/, 'string'],
            [/\/\/.*$/, 'comment'],
            [/\d+\.?\d*/, 'number'],
            [/@[a-zA-Z_]\w*/, 'annotation'],
            [/[a-zA-Z_]\w*/, {
                cases: { '@keywords': 'keyword', '@default': 'identifier' }
            }],
        ]
    }
});

// UI Functions
function createFile() {
    const path = prompt('Enter file path (e.g., src/main.tc):');
    if(path) {
        fileSystem.saveFile(path, '');
        updateFileTree();
    }
}

function deleteAllFiles() {
    fileSystem.deleteAll();
    showOutput('All files deleted successfully');
    closeDialog();
}

function updateFileTree() {
    const tree = fileSystem.getStructure();
    const container = document.getElementById('file-tree');
    container.innerHTML = renderTree(tree);
}

function renderTree(node) {
    return `
        <div class="node ${node.type}">
            ${node.type === 'folder' ? '📁' : '📄'} ${node.name}
            ${node.children ? node.children.map(child => renderTree(child)).join('') : ''}
        </div>
    `;
}

// VS Code-like Output Channel
function showOutput(message) {
    const output = document.getElementById('output');
    output.textContent += `\n${new Date().toLocaleTimeString()}: ${message}`;
    output.scrollTop = output.scrollHeight;
}

// Initialize
window.onload = () => {
    updateFileTree();
    setInterval(() => {
        if(currentFile) {
            fileSystem.saveFile(currentFile, editor.getValue());
        }
    }, 30000);
};
