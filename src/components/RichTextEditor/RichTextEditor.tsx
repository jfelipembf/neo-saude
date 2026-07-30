import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extensions'
import DOMPurify from 'dompurify'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import {
  IconAlignCenter, IconAlignLeft, IconAlignRight, IconBold, IconEmoji, IconItalic, IconUnderline,
} from '@/components/icons'
import styles from './RichTextEditor.module.scss'

const FONT_OPTIONS = [
  { value: '', label: 'Fonte padrão' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
]

// Emojis de uso comum numa evolução clínica — sem categorias, só os que
// aparecem na prática (dor, humor, progresso, alertas).
const EMOJI_OPTIONS = [
  '🙂', '😀', '😐', '😕', '😣', '😢', '😮',
  '👍', '👎', '💪', '🤝', '👏', '🙌',
  '⚠️', '✅', '❌', '⭐', '📌', '📈', '📉',
  '🩹', '🦵', '🦶', '🦴', '💊', '🧊', '🔥', '❤️',
]

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

/** Editor de texto rico genérico (fonte, negrito/itálico, alinhamento, cor) —
 *  sem conhecimento de anexo, sessão ou IA; HTML sempre sanitizado
 *  (DOMPurify), tanto ao gravar (aqui) quanto ao exibir (leitor usa a mesma
 *  sanitização). */
export function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiRef = useOutsideClick<HTMLDivElement>(() => setEmojiOpen(false), emojiOpen)

  const editor = useEditor({
    // Underline NÃO entra aqui: o StarterKit da v3 já registra
    // `@tiptap/extension-underline`, e registrar de novo faz o TipTap avisar
    // "Duplicate extension names found: ['underline']" no console. O botão
    // continua funcionando — `toggleUnderline`/`isActive('underline')` vêm da
    // extensão que o StarterKit traz. Antes de somar uma extensão nova aqui,
    // confira se ela já não está na lista dele.
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['paragraph'] }),
      // O texto de apoio é decoração do PARÁGRAFO vazio, não atributo do
      // editor: quem marca `.is-empty` e pendura o `data-placeholder` que o
      // CSS lê é esta extensão. Sem ela o atributo ficava na div raiz e o
      // `attr(data-placeholder)` do `p::before` resolvia vazio — o placeholder
      // simplesmente não aparecia em campo nenhum do prontuário.
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: DOMPurify.sanitize(value),
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(DOMPurify.sanitize(editor.getHTML())),
    editorProps: {
      attributes: { class: styles.content },
    },
  })

  // `value` pode trocar de fora (ex.: trocar de sessão no modal, ou o botão
  // "Aprimorar com IA" reescrevendo o campo) — TipTap não é um input
  // controlado, então sincroniza manualmente quando o HTML difere do que está
  // na tela (evita loop com onUpdate, que já manda o mesmo HTML).
  useEffect(() => {
    const clean = DOMPurify.sanitize(value)
    if (editor && clean !== editor.getHTML()) editor.commands.setContent(clean)
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <select
          className={styles.fontSelect}
          disabled={disabled}
          value={editor.getAttributes('textStyle').fontFamily ?? ''}
          onChange={e => {
            const font = e.target.value
            if (font) editor.chain().focus().setFontFamily(font).run()
            else editor.chain().focus().unsetFontFamily().run()
          }}
        >
          {FONT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <span className={styles.divider} />

        <button
          type="button"
          className={`${styles.btn} ${editor.isActive('bold') ? styles['btn--active'] : ''}`}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrito"
        >
          <IconBold />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${editor.isActive('italic') ? styles['btn--active'] : ''}`}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Itálico"
        >
          <IconItalic />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${editor.isActive('underline') ? styles['btn--active'] : ''}`}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Sublinhado"
        >
          <IconUnderline />
        </button>

        <span className={styles.divider} />

        <button
          type="button"
          className={`${styles.btn} ${editor.isActive({ textAlign: 'left' }) ? styles['btn--active'] : ''}`}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="Alinhar à esquerda"
        >
          <IconAlignLeft />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${editor.isActive({ textAlign: 'center' }) ? styles['btn--active'] : ''}`}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="Centralizar"
        >
          <IconAlignCenter />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${editor.isActive({ textAlign: 'right' }) ? styles['btn--active'] : ''}`}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="Alinhar à direita"
        >
          <IconAlignRight />
        </button>

        <span className={styles.divider} />

        <label className={styles.colorSwatch} style={{ '--swatch-color': editor.getAttributes('textStyle').color ?? '#000000' } as CSSProperties}>
          <input
            type="color"
            disabled={disabled}
            value={editor.getAttributes('textStyle').color ?? '#000000'}
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            aria-label="Cor da letra"
          />
        </label>

        <span className={styles.divider} />

        <div className={styles.emojiWrapper} ref={emojiRef}>
          <button
            type="button"
            className={`${styles.btn} ${emojiOpen ? styles['btn--active'] : ''}`}
            disabled={disabled}
            onClick={() => setEmojiOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={emojiOpen}
            aria-label="Inserir emoji"
          >
            <IconEmoji />
          </button>

          {emojiOpen && (
            <div className={styles.emojiPanel} role="menu">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={styles.emojiOption}
                  role="menuitem"
                  onClick={() => {
                    editor.chain().focus().insertContent(emoji).run()
                    setEmojiOpen(false)
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditorContent editor={editor} className={styles.editorWrapper} />
    </div>
  )
}
