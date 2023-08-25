// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
// import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

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
	const { keyValuePairs, multipleResult, objectResult} = resultObject;
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
				multipleResult[lastName].push({key, value});
			} else {
				multipleResult[lastName] = [{key, value}];
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
		for (let i = 0;i<paths.length;i++) {
			if (paths[i].indexOf(projectName) > -1) {
				realI18nPath = paths[i];
				break;
			}
		}
		if (!realI18nPath) {
			vscode.window.showInformationMessage('realI18nPath not found ');
			return;
		}
		console.log(777,realI18nPath);
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
			const { keyValuePairs, multipleResult, objectResult} = resultObject;
			if (editor) {
				// 获取光标的文本
				const selection = editor.selection;
				const selectedText = editor.document.getText(selection);
				if (keyValuePairs[selectedText]) {
					vscode.window.showInformationMessage(keyValuePairs[selectedText]);
				} else if (multipleResult[selectedText]){
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
			vscode.window.showInformationMessage('Not found',JSON.stringify(error));
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
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
