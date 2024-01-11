# i18nhelper README

## description

这是帮助国际化项目快速得到翻译内容的插件<br>
可以根据选中的'xx.xx.xx'或者最后一个名字xx，右键，得到翻译的文本的插件。

This is a plugin designed to assist internationalization projects. It allows you to quickly locate translated texts based on 'xx.xx.xx' notation or the last name 'xx'.
## development build

vsce package --no-yarn

## Features

一、选中词汇并翻译<br>
1.可同时设置多个项目的i18n配置<br>
2.可配置目录或者文件(目录会解析第一层的文件)<br>
二、国际化开发辅助工具<br>
1.根据中文含义批量生成国际化资源<br>
2.快速替换当前区域为正确的国际化文本<br>

一、translate the selected vocabulary<br>
1.You can simultaneously configure the i18n settings for multiple projects.<br>
2.You can configure directories or files (directories will parse the files in the first layer).<br>

二、国际化开发辅助工具<br>
1.根据中文含义批量生成国际化资源<br>
2.快速替换当前区域为正确的国际化文本<br>


## Requirements

vscode >= 1.48.0

## Extension Settings

在settings中搜索i18n 配置，然后在中配置i18nPathDirectory 数组 <br>
exapmles:<br>
如果该项目是一个i18n的js文件，将这个文件的path放入到数组中<br>
如果是一个目录(eg:en_CN)就配置该目录path<br>
"i18nhelper.i18nPathDirectory": [<br>
    "/Users/XXX/react-demo/src/i18n/en_CN/aaa.js",<br>
    "/Users/XXX/react-demo2/src/i18n/en_CN",<br>
],<br>
windows 注意:<br>
路径配置时需要加转义符号或者改为左斜杠(eg: "E:/xxxx/xxx")<br>

Search for i18n configuration in the settings, and then within it, configure an array called i18nPathDirectory.<br>
Examples:<br>
If the project involves an i18n JavaScript file, place the path of that file into the array.
If it's a directory (e.g., en_CN), configure the path for that directory.<br>
"i18nhelper.i18nPathDirectory": [<br>
    "/Users/XXX/react-demo/src/i18n/en_CN/aaa.js",<br>
    "/Users/XXX/react-demo2/src/i18n/en_CN",<br>
],<br>
Windows Note: <br>
When configuring paths, you need to use escape characters or change the backslashes to forward slashes (e.g., "E:/xxxx/xxx"). <br>


## Usage

选中'xx.xx.xx' 字符串或者最后一个xx字符串，然后右键选择i18nHelper ,就可以看到翻译后的文本

Select the 'xx.xx.xx' string or the last 'xx' string, then right-click and choose i18nHelper. This action will display the translated text for you.

一、选中词汇并翻译<br>
![config](images/config.png)
![usage](images/usage.png)

二、国际化开发辅助工具<br>

![collect1](images/collect1.png)
![collect2](images/collect2.png)
![result1](images/result1.png)
![result2](images/result2.png)
![replace1](images/replace1.png)
![replace2](images/replace2.png)
![config2](images/config2.png)

## contact

if you have some question ,please contact me.
573068185@qq.com




**Enjoy!**
