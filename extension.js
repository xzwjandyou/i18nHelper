// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
// import * as fs from 'fs';
const { traditionalized } = require('./util');

let baseText = '';
let i18nArray = [];

const I18nFileType = {
	Directory: '0',
	File: '1',
}

function isDirectory(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (error) {
		// 处理错误，例如路径不存在
		return false;
	}
}

function isJavaScriptFile(path) {
	return /\.(js|tsx|jsx|ts)$/i.test(path);
}


//  解析文件 获取keyvalue 放入resultObject结果中
const collectFileResult = (fileContent, resultObject) => {
	const { keyValuePairs, multipleResult, objectResult } = resultObject;
	// 在这里对文件内容进行解析
	const keyValueRegex = /'([^']+)':\s*'([^']+)'/g;
	let match;
	while ((match = keyValueRegex.exec(fileContent)) !== null) {
		const key = match[1];
		const value = match[2];
		keyValuePairs[key] = value;
		const array = (key || '').split('.');
		if (array.length) {
			const lastName = array[array.length - 1];
			if (multipleResult[lastName]) {
				multipleResult[lastName].push({ key, value });
			} else {
				multipleResult[lastName] = [{ key, value }];
			}
		}
	}
	const regex = /([a-zA-Z0-9_]+)\s*:\s*'([^']+)'/g;
	const matches = fileContent.matchAll(regex);
	for (const match of matches) {
		const [, key, value] = match;
		objectResult[key] = value;
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable1 = vscode.commands.registerCommand('extension.myCommand', () => {
		// 获取当前活动的工作区根文件夹
		const workspaceFolders = vscode.workspace.workspaceFolders;
		let projectName = undefined;
		if (workspaceFolders) {
			const rootPath = workspaceFolders[0].uri.fsPath;
			const normalizedPath = rootPath.replace(/\\/g, '/');
			const rootPaths = normalizedPath.split('/');
			console.log('项目根目录：', rootPaths);
			projectName = rootPaths[rootPaths.length - 1];
		} else {
			vscode.window.showInformationMessage('not found root projectName');
			return;
		}
		// 获取当前用户的项目配置，可配置多个项目
		const editor = vscode.window.activeTextEditor;
		const config = vscode.workspace.getConfiguration('i18nhelper');
		const paths = config.get('i18nPathDirectory');
		if (!paths.length) {
			vscode.window.showInformationMessage('paths not set ');
			return;
		}
		// 根据当前根项目 找到对应的项目setting配置path
		let realI18nPath = undefined;
		for (let i = 0; i < paths.length; i++) {
			if (paths[i].indexOf(projectName) > -1) {
				realI18nPath = paths[i];
				break;
			}
		}
		if (!realI18nPath) {
			vscode.window.showInformationMessage('realI18nPath not found ');
			return;
		}
		console.log(777, realI18nPath);
		// 判断path类型，默认是目录
		let projectI18nType = undefined;
		if (isDirectory(realI18nPath)) {
			projectI18nType = I18nFileType.Directory;
		} else if (isJavaScriptFile(realI18nPath)) {
			projectI18nType = I18nFileType.File;
		} else {
			vscode.window.showInformationMessage(`path:${realI18nPath} is not support`);
		}

		try {
			const resultObject = {
				// 全称健值对
				keyValuePairs: {},
				// 根据最后一位 存储的value数组类型健值对
				multipleResult: {},
				// 对象类型解析健值对
				objectResult: {},
			}
			// 目录处理
			if (projectI18nType === I18nFileType.Directory) {
				const fileNames = fs.readdirSync(realI18nPath);
				for (const fileName of fileNames) {
					if (isJavaScriptFile(fileName)) {
						const filePath = path.join(realI18nPath, fileName);
						const fileContent = fs.readFileSync(filePath, 'utf-8');
						collectFileResult(fileContent, resultObject);

					}
				}
			}
			// 文件处理
			if (projectI18nType === I18nFileType.File) {
				const fileContent = fs.readFileSync(realI18nPath, 'utf-8');
				collectFileResult(fileContent, resultObject);
			}
			const { keyValuePairs, multipleResult, objectResult } = resultObject;
			if (editor) {
				// 获取光标的文本
				const selection = editor.selection;
				const selectedText = editor.document.getText(selection);
				if (keyValuePairs[selectedText]) {
					vscode.window.showInformationMessage(keyValuePairs[selectedText]);
				} else if (multipleResult[selectedText]) {
					const array = multipleResult[selectedText];
					const messageArray = array.map(item => `${item.key}:${item.value}`);
					vscode.commands.executeCommand('extension.showMultilineMessage', messageArray);
				} else if (objectResult[selectedText]) {
					vscode.window.showInformationMessage(`object export:${objectResult[selectedText]}`);
				} else {
					vscode.window.showInformationMessage('Not found');
				}
			} else {
				vscode.window.showInformationMessage('Not found');
			}
		} catch (error) {
			vscode.window.showInformationMessage('Not found', JSON.stringify(error));
		}
	});

	context.subscriptions.push(disposable1);

	const disposable = vscode.commands.registerCommand('extension.showMultilineMessage', (arrayToShow) => {
		// const arrayToShow = ['Item 1', 'Item 2', 'Item 3'];
		const message = arrayToShow.join('<br>'); // 使用 <br> 标签换行

		const panel = vscode.window.createWebviewPanel(
			'multilineMessage',
			'Multiline Message',
			vscode.ViewColumn.One,
			{}
		);

		panel.webview.html = `<html><body>${message}</body></html>`;
	});
	context.subscriptions.push(disposable);

	// 收集中文
	const translateCollect = vscode.commands.registerCommand('extension.translateCollect', async () => {
		const config = vscode.workspace.getConfiguration('i18nhelper');
		const funcName = config.get('funcName');

		// 获取当前编辑器
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			// 获取当前选择的文本
			const selectedText = editor.document.getText(editor.selection);
			if (!selectedText) {
				vscode.window.showInformationMessage('请选择要国际化的文本');
				return;
			}
			// 弹出输入框
			const userInput = await vscode.window.showInputBox({
				prompt: '输入国际化标识规则是(xxxx.xxxx.xxxx)',
				value: `${baseText}`, // 将选择的文本作为默认值
			});
			if (!userInput) {
				vscode.window.showInformationMessage('请输入国际化唯一标识前缀');
				return
			}
			const array = userInput.split('.');
			baseText = array.slice(0, array.length - 1).join('.') + '.';
			let currentName = '';
			console.log('array', array);
			if (array.length) {
				currentName = array[array.length - 1];
			} else {
				vscode.window.showInformationMessage('请输入唯一标识');
				return
			}
			const item = { name: `${baseText}${currentName}`, func: funcName, text: selectedText };
			i18nArray.push(item);
			console.log(i18nArray);
			vscode.window.showInformationMessage(`${selectedText}-国际化已保存`);

			// const document = await vscode.workspace.openTextDocument({
			// 	language: 'javascript', // 设置文档语言
			// 	content: text, // 设置文档内容
			// });
			// 显示新文档在新的编辑器页签中
			// await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });
		}

	});
	context.subscriptions.push(translateCollect);

	// 清理缓存
	const translateClear = vscode.commands.registerCommand('extension.translateClear', async () => {
		// 获取当前编辑器
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const confirmation = await vscode.window.showInformationMessage(
				`确认要清除国际化缓存吗？`,
				'确认',
				'取消'
			);
			if (confirmation === '确认') {
				i18nArray = [];
				vscode.window.showInformationMessage(`清理缓存成功`);
			}
		}
	});
	context.subscriptions.push(translateClear);

	// 转换结果
	const translateResult = vscode.commands.registerCommand('extension.translateResult', async () => {

		const config = vscode.workspace.getConfiguration('i18nhelper');
		let funcName = config.get('funcName');
		const array = funcName.split('-');
		// 判断是id模式还是直接是参数
		let hasId = false;
		if (array.length > 1) {
			hasId = true;
			funcName = array[0];
		}
		let hasDefaultMessage = false;
		for (let i = 0; i < array.length; i++) {
			if (array[i] === 'defaultMessage') {
				hasDefaultMessage = true;
			}
		}

		let text = '======================简体=====================================' + '\n';
		for (let i = 0; i < i18nArray.length; i++) {
			const item = i18nArray[i];
			const itemStr = `'${item.name}': '${item.text}',`;
			text = text + itemStr + '\n';
		}
		text = text + '======================繁体=====================================' + '\n'
		for (let i = 0; i < i18nArray.length; i++) {
			const item = i18nArray[i];
			const itemStr = `'${item.name}': '${traditionalized(item.text)}',`;
			text = text + itemStr + '\n';
		}
		text = text + '======================函数=====================================' + '\n'

		// 函数填写
		for (let i = 0; i < i18nArray.length; i++) {
			const item = i18nArray[i];
			let itemStr = '';
			let obj = '';
			if (hasId) {
				// 对象模式 添加id等元素
				obj = `id:'${item.name}'`;
				if (hasDefaultMessage) {
					obj = obj + ',' + `defaultMessage: '${item.text}'`
				}
				obj = `{${obj}}`
			} else {
				obj = `'${item.name}'`;
			}

			itemStr = `'${item.text}': \n${funcName}(${obj})`;
			text = text + itemStr + '\n';
		}

		const document = await vscode.workspace.openTextDocument({
			language: 'javascript', // 设置文档语言
			content: text, // 设置文档内容
		});
		// 显示新文档在新的编辑器页签中
		await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

	});
	context.subscriptions.push(translateResult);

	// 替换文本
	const translateReplace = vscode.commands.registerCommand('extension.translateReplace', async () => {

		const config = vscode.workspace.getConfiguration('i18nhelper');
		let funcName = config.get('funcName');
		const array = funcName.split('-');
		// 判断是id模式还是直接是参数
		let hasId = false;
		if (array.length > 1) {
			hasId = true;
			funcName = array[0];
		}
		let hasDefaultMessage = false;
		for (let i = 0; i < array.length; i++) {
			if (array[i] === 'defaultMessage') {
				hasDefaultMessage = true;
			}
		}

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			// 获取当前选择的文本
			const selectedText = editor.document.getText(editor.selection);
			if (!selectedText) {
				vscode.window.showInformationMessage('请选择要替换的国际化文本');
				return;
			}

			for (let i = 0; i < i18nArray.length; i++) {
				const item = i18nArray[i];
				if (selectedText !== item.text) continue;
				let obj = '';
				if (hasId) {
					// 对象模式 添加id等元素
					obj = `id:'${item.name}'`;
					if (hasDefaultMessage) {
						obj = obj + ',' + `defaultMessage: '${item.text}'`
					}
					obj = `{${obj}}`
				} else {
					obj = `'${item.name}'`;
				}
				console.log(`${funcName}(${obj})`);
				const selection = editor.selection;
				editor.edit(editBuilder => {
					// 替换选中的文本
					editBuilder.replace(selection, `${funcName}(${obj})`);
					vscode.window.showInformationMessage('替换成功');
				});
				return;
			}
			vscode.window.showInformationMessage('没有找到可替换的国际化文本');
			return;

		}
	});
	context.subscriptions.push(translateReplace);

}



// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
