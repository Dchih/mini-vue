import { NodeTypes } from "./ast";

const enum TagType {
  START,
  END,
}

const openDelimiter = "{{";
const closeDelimiter = "}}";

export function baseParser(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
}
function createParserContext(content: string) {
  return {
    source: content,
  };
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}

function parseChildren(context, ancestors) {
  const nodes: any = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (context.source.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s.startsWith("<")) {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function parseText(context: any) {
  let endIndex = context.source.length;
  // const delimiterIndex = context.source.indexOf(openDelimiter);
  // const closeDelimiterIndex = context.source.indexOf(`</${parentTag}>`);
  // if (delimiterIndex !== -1) {
  //   endIndex = delimiterIndex;
  // }
  // if (closeDelimiterIndex !== -1 && closeDelimiterIndex < delimiterIndex) {
  //   endIndex = closeDelimiterIndex;
  // }
  const endTokens = ["<", "{{"];
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);
  advancedBy(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}

function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.START);
  const s = context.source;
  ancestors.push(element);
  // if (!/^<\//.test(s))
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  const tagTobeHandled = startsWithEndTagOpen(context, element.tag);
  if (element.tag === tagTobeHandled) {
    parseTag(context, TagType.END);
  } else {
    throw new Error(`${element.tag} 标签没有匹配的结束标签`);
  }
  return element;
}

function startsWithEndTagOpen(context, tag) {
  return context.source.slice(2, 2 + tag.length);
}

function parseTag(context, tagType: TagType) {
  const elementStartFlag = /^<\/?([a-z]*)/i;
  const matched: any = elementStartFlag.exec(context.source);
  const tag = matched[1];
  advancedBy(context, matched[0].length);
  advancedBy(context, 1);
  if (tagType === TagType.END) return;
  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
  };
}

function parseInterpolation(context) {
  const closeIndex = context.source.indexOf(closeDelimiter);
  advancedBy(context, openDelimiter.length);
  const rawIndexLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawIndexLength);
  const content = rawContent.trim();
  advancedBy(context, closeIndex);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advancedBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function parseTextData(context, length): string {
  return context.source.slice(0, length);
}

function isEnd(context, ancestors) {
  // </
  // source 为空
  const s = context.source;
  if (s.startsWith("</")) {
    for (let i = 0; i < ancestors.length; i++) {
      const ancestorTag = ancestors[i].tag;
      const tag = startsWithEndTagOpen(context, ancestorTag);
      if (tag === ancestorTag) return true;
    }
  }
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true;
  // }
  return !s;
}
