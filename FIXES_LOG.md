# WP5 Pilot Platform - Log de Mejoras

## Problemas Detectados y Soluciones

### 1. Agentes sin personalidades consistentes
**Problema:** Los agentes se contradecian a si mismos y no mantenian un comportamiento coherente durante la conversacion.

**Causa:** El sistema solo tenia nombres de agentes, sin definir personalidades individuales. El Director no tenia informacion para mantener consistencia.

**Solucion:**
- Agregado campo `persona` al modelo Agent
- Modificado el prompt del Director para incluir personalidades
- Agregada UI en el Admin Panel para definir personalidades por agente
- Instruccion explicita al Director: "Maintain consistency - each agent should stay true to their personality traits"

**Archivos modificados:**
- `backend/models/agent.py`
- `backend/agents/STAGE/director.py`
- `backend/platforms/chatroom.py`
- `frontend/lib/admin-types.ts`
- `frontend/components/admin/steps/StepSession.tsx`
- `frontend/components/admin/AdminPanel.tsx`

---

### 2. Configuracion tediosa del experimento
**Problema:** Habia que rellenar todos los campos manualmente cada vez, muy lento para pruebas.

**Solucion:** Valores por defecto pre-configurados:
- 4 agentes con nombres y personalidades definidas (Carlos, Maria, Pedro, Laura)
- Diseño 2x2 ya creado (civil_pro, civil_against, incivil_pro, incivil_against)
- LLMs pre-configurados (Anthropic Director, HuggingFace Performer/Moderator)
- Contexto de chatroom pre-rellenado

---

### 3. Modelo sin censura para contenido incivil
**Problema:** Modelos como Claude pueden rechazar generar contenido muy agresivo.

**Solucion:** Configurado `dphn/Dolphin-Mistral-24B-Venice-Edition` como Performer por defecto (modelo "uncensored" via HuggingFace/Featherless AI).

---

### 4. Token de HuggingFace no cargado
**Problema:** Error "Cannot select auto-router when using non-Hugging Face API key"

**Causa:** El contenedor Docker no recargaba las variables de entorno con `docker compose restart`.

**Solucion:** Usar `docker compose up -d --force-recreate app` para forzar la recarga del `.env`.

---

## Configuracion de LLMs Recomendada

| Rol | Provider | Modelo | Motivo |
|-----|----------|--------|--------|
| Director | Anthropic | claude-sonnet-4-20250514 | Bueno razonando y decidiendo |
| Performer | HuggingFace | Dolphin-Mistral-24B:featherless-ai | Sin censura |
| Moderator | HuggingFace | Llama-3.1-8B-Instruct | Rapido y barato |

---

## Comandos Utiles

```bash
# Reconstruir y lanzar
sudo docker compose up -d --build

# Ver logs del backend
sudo docker compose logs app --tail=100

# Reiniciar con nuevas variables de entorno
sudo docker compose up -d --force-recreate app
```
