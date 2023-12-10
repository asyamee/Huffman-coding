// Выбор DOM-элементов
const FILE_WINDOW = document.querySelector('.file-window');
const GO_BUTTON = document.querySelector('.submit');
const COMPRESSED_FILE_WINDOW = document.querySelector('.compressed-window');
const KEY_WINDOW = document.querySelector('.key-window');
const GOGO_BUTTON = document.querySelector('.decompress');

// Обработчики событий для кнопок
GO_BUTTON.addEventListener('click', () => handleFileChange(FILE_WINDOW));
GOGO_BUTTON.addEventListener('click', () => handleFilesChanges(COMPRESSED_FILE_WINDOW, KEY_WINDOW));

// Обработчик изменения файла
function handleFileChange(input) {
	if (!input.files[0]) {
		alert('Нужен файл!');
		return;
	}

	const reader = new FileReader();
	const file = input.files[0];

	reader.readAsText(file);

	reader.onload = () => {
		const [key, textContent] = readFile(reader.result);
		createAndSendFiles(getFileName(file.name), textContent, JSON.stringify(key));
	};

	reader.onerror = () => {
		console.log(reader.error, 'Error caught!');
	};
}

// Функция для чтения и обработки двух файлов
function handleFilesChanges(firstInput, secondInput) {
	const file1 = firstInput.files[0];
	const file2 = secondInput.files[0];

	if (!file1 || !file2) {
		alert('Нужно два файла');
		return;
	}

	Promise.all([readFileMultiple(file1), readFileMultiple(file2)]).then(([content1, content2]) => decompressAndSendFile(content1, content2, getFileName(file1.name)));
}

// Функция для чтения содержимого файла (Promise)
function readFileMultiple(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => resolve(e.target.result);
		reader.onerror = (e) => reject(e);

		reader.readAsText(file);
	});
}

// Получение имени файла без расширения
function getFileName(text) {
	return text.split('.')[0];
}

// Декомпрессия и отправка файла
function decompressAndSendFile(file, key, filename) {
	const swappedCodes = swapKeysAndValues(JSON.parse(key));
	const decompressedText = decompressHuffman(file, swappedCodes);

	const decompressedFile = document.createElement('a');
	const decompressedBlob = new Blob([decompressedText], { type: 'plain/text' });
	const decompressedURL = URL.createObjectURL(decompressedBlob);

	decompressedFile.setAttribute('href', decompressedURL);
	decompressedFile.setAttribute('download', `${filename}-decompressed.txt`);

	decompressedFile.style.display = 'none';
	document.body.appendChild(decompressedFile);
	decompressedFile.click();
}

// Обмен ключами и значениями в объекте
function swapKeysAndValues(obj) {
	const swappedObj = {};
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			swappedObj[obj[key]] = key;
		}
	}
	return swappedObj;
}

// Декомпрессия с использованием кодировки Хаффмана
function decompressHuffman(compressedText, savedHuffmanCode) {
	let currentCode = '';
	let decompressedText = '';

	for (const bit of compressedText) {
		currentCode += bit;

		if (savedHuffmanCode[currentCode]) {
			decompressedText += savedHuffmanCode[currentCode];
			currentCode = '';
		}
	}

	return decompressedText;
}

// Создание и отправка сжатых файлов и ключа
function createAndSendFiles(filename, content, key) {
	const compressedFile = document.createElement('a');
	const keyFile = document.createElement('a');

	const blobCompressed = new Blob([content], { type: 'application/octet-stream' });
	const blobKey = new Blob([key], { type: 'plain/text' });

	const fileURL = URL.createObjectURL(blobCompressed);
	const keyURL = URL.createObjectURL(blobKey);

	compressedFile.setAttribute('href', fileURL);
	compressedFile.setAttribute('download', `${filename}.bin`);

	keyFile.setAttribute('href', keyURL);
	keyFile.setAttribute('download', `${filename}-key.txt`);

	keyFile.style.display = 'none';
	document.body.appendChild(keyFile);
	keyFile.click();

	compressedFile.style.display = 'none';
	document.body.appendChild(compressedFile);
	compressedFile.click();
}

// Чтение файла и подготовка к сжатию
function readFile(text) {
	const frequencyDict = createFrequencyDictionary(text);
	const huffmanTree = buildHuffmanTree(frequencyDict);
	const huffmanCodes = buildHuffmanCodes(huffmanTree);
	const encodedText = encodeHuffman(text, huffmanCodes);

	return [huffmanCodes, encodedText];
}

// Создание словаря частотности символов
function createFrequencyDictionary(text) {
	const frequencyDict = {};
	for (const char of text) {
		frequencyDict[char] = (frequencyDict[char] || 0) + 1;
	}
	return frequencyDict;
}

// Класс для узла дерева Хаффмана
class HuffmanNode {
	constructor(char, frequency) {
		this.char = char;
		this.frequency = frequency;
		this.left = null;
		this.right = null;
	}
}

// Построение дерева Хаффмана
function buildHuffmanTree(frequencyDict) {
	const nodes = Object.keys(frequencyDict).map((char) => new HuffmanNode(char, frequencyDict[char]));

	while (nodes.length > 1) {
		nodes.sort((a, b) => a.frequency - b.frequency);

		const left = nodes.shift();
		const right = nodes.shift();

		const newNode = new HuffmanNode(null, left.frequency + right.frequency);
		newNode.left = left;
		newNode.right = right;

		nodes.push(newNode);
	}

	return nodes[0];
}

// Построение кодов Хаффмана на основе дерева
function buildHuffmanCodes(root) {
	const codes = {};

	function traverse(node, code) {
		if (node.char) {
			codes[node.char] = code;
		} else {
			traverse(node.left, code + '0');
			traverse(node.right, code + '1');
		}
	}

	traverse(root, '');
	return codes;
}

// Кодирование Хаффмана текста
function encodeHuffman(text, codes) {
	let encodedText = '';
	for (const char of text) {
		encodedText += codes[char];
	}
	return encodedText;
}

// Декодирование Хаффмана закодированного текста
function decodeHuffman(encodedText, root) {
	let decodedText = '';
	let currentNode = root;

	for (const bit of encodedText) {
		currentNode = bit === '0' ? currentNode.left : currentNode.right;

		if (currentNode.char) {
			decodedText += currentNode.char;
			currentNode = root;
		}
	}

	return decodedText;
}
