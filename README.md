# Installation
```js
 npm install rich-text-compare
```

#Examples
```js


import compare from "rich-text-compare"
const oldStr = `<p>hello</p>`
const newStr = `<p>hello1</p>`
const diffStr = compare(newStr,oldStr,{
    // 删除文本样式
    deleteTextStyle:`;color: red; text-decoration: line-through;background-color: #F59A23;`,
    // 添加文本样式
    addTextStyle:`;color: green;background-color: #95F204;`,
    // 文本格式修改样式
    styleChanged:`;background-color: #8080FF;display: inline-block`
})

// diffStr = `<p>hello<span style='color: green;background-color: #95F204;'>1</span><p>`

```
<p>hello<span style='color: green;background-color: #95F204;'>1</span><p>
