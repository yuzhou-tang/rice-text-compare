// v1 版
const compiler = require("vue-template-compiler");
const Diff = require("diff");

// 默认样式
let deleteTextStyle =
  ";color: red; text-decoration: line-through;background-color: #F59A23;";
let addTextStyle = ";color: green;background-color: #95F204;";
let styleChanged = ";background-color: #8080FF;display: inline-block";
 
// 文本对比 挑出不同的字体
const diffText = function (newText, oldText) {
  const diffTextArr = Diff.diffChars(oldText, newText);
  const diffMap = {
    added: [],
    removed: [],
    diffTextArr
  };
  diffTextArr.forEach((item) => {
    item.added && diffMap.added.push(item);
    item.removed && diffMap.removed.push(item);
  });
  return diffMap;
};

// 虚拟节点转模板字符串
const vnodeToTemString = function (vnode) {
  if (vnode.type === 1) {
    //元素节点
    let childrenStr = "";
    for (let i = 0; i < vnode.children.length; i++) {
      const child = vnode.children[i];
      childrenStr += vnodeToTemString(child);
    }
    if (vnode.attrsMap.style)
      return `<${vnode.tag} style="${vnode.attrsMap.style}">${childrenStr}</${vnode.tag}>`;
    else return `<${vnode.tag}>${childrenStr}</${vnode.tag}>`;
  } else if (vnode.type === 3) {
    if (vnode.style) return `<span style='${vnode.style}'>${vnode.text}</span>`;
    else return vnode.text;
  } else {
    return "";
  }
};
 
// 模板字符串转虚拟节点
const stringToVnodeList = function (template) {
  return compiler.compile(`${template}`).ast;
};

// 将Vnode text 设置成新添加模式
const vnodeTextTypeAdd = function (vNode) {
  if (vNode.type === 3) {
    // 如果就是一个文本节点
    vNode.style = addTextStyle;
  } else if (vNode.type === 1) {
    // 元素节点
    vNode.children &&
      vNode.children.forEach((item) => {
        vnodeTextTypeAdd(item);
      });
  }
};

// 将Vnode text 设置成删除模式
const vnodeTextTypeDelete = function (vNode) {
  if (vNode.type === 3) {
    // 如果就是一个文本节点 设置成删除样式
    vNode.style = deleteTextStyle;
  } else if (vNode.type === 1) {
    // 元素节点
    vNode.children &&
      vNode.children.forEach((item) => {
        vnodeTextTypeDelete(item);
      });
  }
  return vNode;
};

// 判断style属性是不是相同，相同返回flase 不同返回true
const isDiffStyleFromVnode = function (newVnode, oldVnode) {
  if(newVnode.type === 1 && oldVnode.type === 1) {
   const newVnodeStyle = newVnode.attrsMap.style ? newVnode.attrsMap.style.replace(/\s*/g,"") : ""
   const oldvnodeStyle = oldVnode.attrsMap.style ? oldVnode.attrsMap.style.replace(/\s*/g,"") : ""
   return newVnodeStyle !== oldvnodeStyle
  }
  return false
} 

/**
 * ! 对比新旧虚拟节点列表
 * */
const diffVnodeList = function (newVnodeList, oldVnodeList, newVnode) {
  const minLength = Math.min(newVnodeList.length, oldVnodeList.length);
  let i;
  // * 需要记录一下初始时候的长度 因为后面可能会改变数组的长度
  const newVnodeListLength = newVnodeList.length;
  const oldVnodeListLength = oldVnodeList.length;
  for (i = 0; i < minLength; i++) {
    let newVnodeItem = newVnodeList[i];
    const oldVnodeItem = oldVnodeList[i];
    if (newVnodeItem.type === 3 && oldVnodeItem.type === 3) {
      //新旧节点都是文本虚拟节点
      if (newVnodeItem.text !== oldVnodeItem.text) {
        // 如果文本不相同
        const { diffTextArr } = diffText(
          newVnodeItem.text,
          oldVnodeItem.text
        );
        let diffStr = ""
        diffTextArr.forEach(item=>{
          console.log(item);
          if(item.removed){
            diffStr +=  `<span style='${deleteTextStyle}'>${item.value}</span>`
          }else if(item.added){
            diffStr +=  `<span style='${addTextStyle}'>${item.value}</span>`
          }else{
            diffStr += item.value
          }
        })
        newVnodeItem.text = diffStr
      }
       
    } else if (newVnodeItem.type === 1 && oldVnodeItem.type === 1) {
      if (newVnodeItem.tag !== oldVnodeItem.tag) {
        newVnodeItem.attrsMap.style
          ? (newVnodeItem.attrsMap.style +=
            styleChanged)
          : (newVnodeItem.attrsMap.style =
            styleChanged);
        // 子节点还得比较吧
        diffVnodeList(
          newVnodeItem.children,
          oldVnodeItem.children,
          newVnodeItem
        );
      } else {
        // * 标签相同 由于没有key 这里只是简单的比较标签是否相同
        // 对比标签上的样式是不是一样
      if( isDiffStyleFromVnode(newVnodeItem,oldVnodeItem) )
      {
        newVnodeItem.attrsMap.style
         ? (newVnodeItem.attrsMap.style +=
          styleChanged)
         : (newVnodeItem.attrsMap.style =
          styleChanged);
      }
        diffVnodeList(
          newVnodeItem.children,
          oldVnodeItem.children,
          newVnodeItem
        );
      }
    } else if (newVnodeItem.type === 3 && oldVnodeItem.type === 1) {
      // 如果老节点是一个换行
      if(oldVnodeItem.tag === 'br'){
        newVnodeItem.style = addTextStyle
        return 
      }
      // 新节点是一个文本节点 而老节点是一个元素节点
      // const textVnode = createTextVnode(newVnodeItem.text, styleChanged);
      // newVnode.children.splice(i, 1, textVnode);
    } else if (newVnodeItem.type === 1 && oldVnodeItem.type === 3) {
      if(newVnodeItem.tag === "br"){
        // 新vnode 对比的地方只是一个换行符号
        Object.assign(newVnodeItem, createTextVnode(oldVnodeItem.text, deleteTextStyle))
        return;
      }
      // 新节点是一个元素节点 而 老节点是一个简单的文本节点
      // 没得比 样式改变吧
      newVnodeItem.attrsMap.style
        ? (newVnodeItem.attrsMap.style += styleChanged)
        : (newVnodeItem.attrsMap.style = styleChanged);
    }
  } // end of for
  // TODO bug 由于 129行 改变了newVnodeList.length 导致出错了 ！！！不能这么判断了
  if (i < newVnodeListLength) {
    // 说明新节点有添加的
    for (i; i < newVnodeList.length; i++) {
      // 将这些节点下的子节点全部设置为新添加的
      vnodeTextTypeAdd(newVnodeList[i]);
    }
  } else if (i < oldVnodeListLength) {
    // 说明老的还没遍历完 新的有删除的
    for (i; i < oldVnodeList.length; i++) {
      // 将这些节点下的子节点全部设置为新添加的
      const deleteVnode = vnodeTextTypeDelete(oldVnodeList[i]);
      newVnodeList.push(deleteVnode);
    }
  }
};

// 对比新旧虚拟节点并返回新vnode生成的模板字符串
const diffVnodeToTemplate = function (newVnode, oldVnode) {
  if (!newVnode?.children?.length || !oldVnode?.children?.length) {
    return;
  }
  diffVnodeList(newVnode.children, oldVnode.children, newVnode);
  return vnodeListToTemString(newVnode.children);
};

// 虚拟节点列表转模板字符串
const vnodeListToTemString = function (vnodeList) {
  let tem = "";
  vnodeList.forEach((vnode) => {
    tem += vnodeToTemString(vnode);
  });
  return tem;
};

// 返回vnode中的文本
const getTextStringFromVnode = function (vnode) {
  let retString = "";
  if (vnode.type === 3) {
    return vnode.text;
  } else if (vnode.type === 1) {
    vnode.children.forEach((child) => {
      retString += getTextStringFromVnode(child);
    });
  }
  return retString;
};

// 创建文本虚拟节点
const createTextVnode = function (text, style) {
  return {
    style,
    text,
    type: 3,
  };
};

// 
const setVnodeTextStyle = function (vnode,type='add'){
  if(vnode.type === 3){
    // 文本节点
    vnode.style = type==="add" ? addTextStyle : deleteTextStyle
  }else if(vnode.type === 1){
    // 元素节点
    vnode.children.forEach((child)=>{
      setVnodeTextStyle(child,type)
    })
  }
}


 /**
 *
 * @param {string} newTemplateStr 新文本模板字符串 
 * @param {string} oldTemplateStr 旧文本模板字符串 
 * @param {Object} [styleOptions] 可选参数 文本对比样式 
 * @return {string} 返回的模板字符串供富文本编辑器使用
 */
export default (newTemplateStr, oldTemplateStr, styleOptions = {}) => {
  newTemplateStr = newTemplateStr && `<template>${newTemplateStr}</template>`
  oldTemplateStr = oldTemplateStr && `<template>${oldTemplateStr}</template>`

   
  // 覆盖默认样式
  styleOptions.styleOptions && (deleteTextStyle = styleOptions.styleOptions);
  styleOptions.addTextStyle && (deleteTextStyle = styleOptions.addTextStyle);
  styleOptions.styleChanged && (deleteTextStyle = styleOptions.styleChanged);
  // 编译成虚拟节点
  const newVnode =newTemplateStr &&  stringToVnodeList(newTemplateStr);
  const oldVnode =oldTemplateStr && stringToVnodeList(oldTemplateStr);

  // 如果有新文本而无老文本则对比时为全新添加
  if(newVnode && !oldVnode){
    // 将文本设置为新添
    setVnodeTextStyle(newVnode,"add")
    return vnodeToTemString(newVnode)
  }else if(!newVnode && oldVnode){
    // 将文本设置为全删除
    setVnodeTextStyle(oldVnode,"delete")
    return vnodeToTemString(oldVnode)
  }else if(!newVnode && !oldVnode){
    return ""
  }
  // 对比新旧节点 并返回新虚拟节点生成的模板字符串
  return diffVnodeToTemplate(newVnode, oldVnode);
};

