# PolyMind Glossary

## Core Concepts

### Council

A group of AI models (Personas) that deliberate on a topic. The Council is the central mechanism of PolyMind, designed to reduce hallucination and improve reasoning quality through dialectic debate.

### Persona

A specific role or personality adopted by an LLM. Examples include "The Skeptic", "The Visionary", "The Engineer". Personas are used to ensure diverse viewpoints in the Council.

### Chairman

The lead model in a Council session (typically the most capable model, e.g., Gemini 3.0 Pro). The Chairman is responsible for synthesizing the arguments presented by other Personas and delivering the final consensus.

### TUI (Terminal User Interface)

A text-based user interface that runs in the terminal. PolyMind uses `ink` to create a rich, interactive TUI with animations, colors, and layout components.

### Streaming

The process of receiving and displaying the LLM's response character-by-character as it is generated. This provides immediate feedback to the user and creates a "matrix-like" visual effect.

## Technical Terms

### Provider

An external service that hosts LLMs (e.g., Google Gemini, OpenAI, Anthropic). PolyMind abstracts these providers to allow seamless switching between models.

### Ink

A React-based library for building CLIs. It allows us to use React components (Box, Text) to render the terminal interface.

### Council Engine

The logic that orchestrates the multi-stage debate workflow (Proposal -> Rebuttal -> Consensus).

### Slash Commands

Commands starting with `/` used in the Interactive Mode to trigger specific actions (e.g., `/debate`, `/clear`, `/config`).
