import { useEffect } from 'react'

export interface SeoMetaProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'product' | 'article'
  jsonLd?: Record<string, any> | Array<Record<string, any>>
}

export function useSeoMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  jsonLd,
}: SeoMetaProps) {
  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title
    }

    // Helper para atualizar ou criar meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attrName, attrVal)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // 2. Meta description
    if (description) {
      setMetaTag('name', 'description', description)
      setMetaTag('property', 'og:description', description)
      setMetaTag('name', 'twitter:description', description)
    }

    // 3. Open Graph Title & Twitter Title
    if (title) {
      setMetaTag('property', 'og:title', title)
      setMetaTag('name', 'twitter:title', title)
    }

    // 4. Open Graph Type
    setMetaTag('property', 'og:type', type)

    // 5. Open Graph Image
    const defaultImage = `${window.location.origin}/og-image.svg`
    const ogImage = image
      ? image.startsWith('http')
        ? image
        : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`
      : defaultImage

    setMetaTag('property', 'og:image', ogImage)
    setMetaTag('name', 'twitter:image', ogImage)

    // 6. Open Graph URL
    const pageUrl = url || window.location.href
    setMetaTag('property', 'og:url', pageUrl)

    // 7. JSON-LD structured data
    let scriptTag = document.getElementById('json-ld-seo') as HTMLScriptElement | null
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.id = 'json-ld-seo'
        scriptTag.type = 'application/ld+json'
        document.head.appendChild(scriptTag)
      }
      scriptTag.text = JSON.stringify(jsonLd)
    } else if (scriptTag) {
      scriptTag.remove()
    }

    return () => {
      // Limpeza opcional se desmontar
    }
  }, [title, description, image, url, type, jsonLd])
}
