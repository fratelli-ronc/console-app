import { Fragment, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Renders the Markdown subset used in RELEASE_NOTES.md: headings, nested
 * bullet / numbered lists, paragraphs, **bold**, *italic*, `code` and
 * [links](url) (shown as plain text). Builds React elements only, so the
 * notes can never inject HTML.
 */

interface ListNode {
  ordered: boolean
  items: ItemNode[]
}

interface ItemNode {
  text: string
  children?: ListNode
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; list: ListNode }

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/

function parse(markdown: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  // Open list levels, outermost first.
  let stack: { indent: number; list: ListNode }[] = []

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }
  const closeList = () => {
    stack = []
  }

  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '')

    if (!line.trim()) {
      flushParagraph()
      continue
    }

    const heading = HEADING_RE.exec(line)
    if (heading) {
      flushParagraph()
      closeList()
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2],
      })
      continue
    }

    const item = ITEM_RE.exec(line)
    if (item) {
      flushParagraph()
      const indent = item[1].replace(/\t/g, '    ').length
      const ordered = /\d/.test(item[2])
      const node: ItemNode = { text: item[3] }

      if (!stack.length) {
        const list: ListNode = { ordered, items: [node] }
        blocks.push({ type: 'list', list })
        stack = [{ indent, list }]
        continue
      }

      while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
        stack.pop()
      }
      const top = stack[stack.length - 1]
      const parent = top.list.items[top.list.items.length - 1]

      if (indent > top.indent && parent) {
        parent.children ??= { ordered, items: [] }
        parent.children.items.push(node)
        stack.push({ indent, list: parent.children })
      } else {
        top.list.items.push(node)
      }
      continue
    }

    // Wrapped line of the current list item.
    if (stack.length && /^\s/.test(line)) {
      const top = stack[stack.length - 1].list
      top.items[top.items.length - 1].text += ` ${line.trim()}`
      continue
    }

    closeList()
    paragraph.push(line.trim())
  }

  flushParagraph()
  return blocks
}

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*)/

function renderInline(text: string): ReactNode {
  return text.split(INLINE_RE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {renderInline(part.slice(2, -2))}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = /^\[([^\]]+)\]\([^)]+\)$/.exec(part)
    if (link) return <Fragment key={i}>{renderInline(link[1])}</Fragment>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{renderInline(part.slice(1, -1))}</em>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

const List: React.FC<{ list: ListNode; nested?: boolean }> = ({
  list,
  nested,
}) => {
  const Tag = list.ordered ? 'ol' : 'ul'
  return (
    <Tag
      className={cn(
        'space-y-1.5 pl-5 marker:text-muted-foreground',
        list.ordered ? 'list-decimal' : nested ? 'list-[circle]' : 'list-disc',
        nested && 'mt-1.5'
      )}
    >
      {list.items.map((item, i) => (
        <li key={i} className="pl-0.5">
          {renderInline(item.text)}
          {item.children && <List list={item.children} nested />}
        </li>
      ))}
    </Tag>
  )
}

export const ReleaseNotes: React.FC<{
  markdown: string
  className?: string
}> = ({ markdown, className }) => {
  const blocks = useMemo(() => parse(markdown), [markdown])

  return (
    <div
      className={cn(
        'space-y-3 text-sm leading-relaxed text-muted-foreground',
        className
      )}
    >
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <p
                key={i}
                className={cn(
                  'font-semibold text-foreground',
                  block.level <= 2 ? 'text-base' : 'text-sm',
                  i > 0 && 'pt-2'
                )}
              >
                {renderInline(block.text)}
              </p>
            )
          case 'paragraph':
            return <p key={i}>{renderInline(block.text)}</p>
          case 'list':
            return <List key={i} list={block.list} />
        }
      })}
    </div>
  )
}
