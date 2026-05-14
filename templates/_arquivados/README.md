# Arquivados

## 14_termo_representacao_inss_pdf_v1.pdf

**Substituído em:** 13/05/2026  
**Motivo:** Conversão do Termo de Representação de PDF (renderizado via pdf-lib com coordenadas fixas) para DOCX (DocxTemplater), permitindo:
- Checkboxes automáticos por tipo de benefício do processo
- Seleção de advogada(s) por condicional (`{#mostrar_lidiane}` / `{#mostrar_alcione}`)
- Controle tipográfico completo (margem, fonte, entrelinha) para caber em página única A4
- Download em Word (.docx) além de PDF, coerente com os demais 6 templates

**Substituto:** `templates/14_termo_representacao_inss.docx`  
**Registro no banco:** `document_templates.codigo = '14_termo_representacao_inss'` com `formato = 'docx'`

O PDF original nunca foi protocolado no INSS — era usado apenas em testes internos.
