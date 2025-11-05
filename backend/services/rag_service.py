"""
RAG (Retrieval-Augmented Generation) service for question answering.

Combines semantic search with LLM-based answer generation to provide
context-aware answers from call transcripts.
"""

import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI

from backend.models.search import SearchFilters
from backend.models.rag import SourceChunk

logger = logging.getLogger(__name__)


class RAGService:
    """
    Service for RAG-based question answering.

    Uses semantic search to retrieve relevant context from call transcripts,
    then generates answers using LLMs (GPT-4o, Claude, etc.).
    """

    def __init__(self, openai_api_key: str, anthropic_api_key: Optional[str] = None):
        """
        Initialize RAG service with API keys.

        Args:
            openai_api_key: OpenAI API key for GPT models
            anthropic_api_key: Anthropic API key for Claude models (optional)
        """
        self.openai_client = OpenAI(api_key=openai_api_key)

        # Anthropic client (optional)
        self.anthropic_client = None
        if anthropic_api_key:
            try:
                from anthropic import Anthropic
                self.anthropic_client = Anthropic(api_key=anthropic_api_key)
            except ImportError:
                logger.warning("Anthropic SDK not installed. Claude models will not be available.")

    async def answer_question(
        self,
        question: str,
        search_results: List[Dict[str, Any]],
        model: str = "gpt-4o"
    ) -> str:
        """
        Generate answer using RAG approach.

        Args:
            question: User's question
            search_results: Results from semantic search
            model: LLM model to use

        Returns:
            Generated answer string

        Raises:
            ValueError: If model is unsupported
            Exception: On LLM API errors
        """
        # Handle no context scenario
        if not search_results:
            return self._generate_no_context_answer(question)

        # Format context from search results
        context = self._format_context(search_results)

        # Build RAG prompt
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(question, context)

        # Call appropriate LLM
        if model.startswith("gpt"):
            answer = await self._call_openai(system_prompt, user_prompt, model)
        elif model.startswith("claude"):
            answer = await self._call_anthropic(system_prompt, user_prompt, model)
        else:
            raise ValueError(f"Unsupported model: {model}")

        return answer

    def _build_system_prompt(self) -> str:
        """
        Build system prompt for RAG.

        Returns:
            System prompt string
        """
        return """You are a helpful AI assistant analyzing sales and support call transcripts.

Your role is to:
- Answer questions based ONLY on the provided call transcript context
- Cite specific calls when making claims (use call IDs like "call_123")
- If the context doesn't contain relevant information, clearly state that
- Be concise but comprehensive in your answers
- Use bullet points or numbered lists for clarity when appropriate
- Maintain a professional and helpful tone

Remember:
- Do NOT make up information not present in the context
- Do NOT use external knowledge beyond the provided transcripts
- Always ground your answers in the specific evidence from the calls"""

    def _build_user_prompt(self, question: str, context: str) -> str:
        """
        Build user prompt with question and context.

        Args:
            question: User's question
            context: Formatted context from search results

        Returns:
            User prompt string
        """
        return f"""Question: {question}

Context from call transcripts:
{context}

Based on the context above, answer the question. Cite specific calls when possible using their call IDs."""

    def _format_context(self, search_results: List[Dict[str, Any]]) -> str:
        """
        Format search results as context for LLM.

        Args:
            search_results: Results from semantic search

        Returns:
            Formatted context string
        """
        context_parts = []

        for i, result in enumerate(search_results, 1):
            metadata = result.get('metadata', {})

            # Build time information if available
            time_info = ""
            start_time = metadata.get('start_time')
            end_time = metadata.get('end_time')
            if start_time is not None and end_time is not None:
                time_info = f", Time: {start_time:.1f}-{end_time:.1f}s"

            # Build company info if available
            company_info = ""
            company_name = metadata.get('company_name')
            if company_name:
                company_info = f", Company: {company_name}"

            # Format chunk with metadata
            context_part = f"""[Source {i} - Call: {result['call_id']}{company_info}{time_info}]
{result['text']}
"""
            context_parts.append(context_part)

        return "\n---\n".join(context_parts)

    async def _call_openai(self, system_prompt: str, user_prompt: str, model: str) -> str:
        """
        Call OpenAI API to generate answer.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt with question and context
            model: OpenAI model to use

        Returns:
            Generated answer

        Raises:
            Exception: On API errors
        """
        try:
            logger.info(f"Calling OpenAI API with model: {model}")

            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more factual responses
                max_tokens=1500,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )

            answer = response.choices[0].message.content

            logger.info(f"Generated answer: {len(answer)} characters")

            return answer

        except Exception as e:
            logger.error(f"OpenAI API error: {e}", exc_info=True)
            raise

    async def _call_anthropic(self, system_prompt: str, user_prompt: str, model: str) -> str:
        """
        Call Anthropic API to generate answer.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt with question and context
            model: Anthropic model to use

        Returns:
            Generated answer

        Raises:
            ValueError: If Anthropic client not initialized
            Exception: On API errors
        """
        if not self.anthropic_client:
            raise ValueError("Anthropic client not initialized. Please provide ANTHROPIC_API_KEY.")

        try:
            logger.info(f"Calling Anthropic API with model: {model}")

            response = self.anthropic_client.messages.create(
                model=model,
                max_tokens=1500,
                temperature=0.3,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            answer = response.content[0].text

            logger.info(f"Generated answer: {len(answer)} characters")

            return answer

        except Exception as e:
            logger.error(f"Anthropic API error: {e}", exc_info=True)
            raise

    def _generate_no_context_answer(self, question: str) -> str:
        """
        Generate answer when no relevant context is found.

        Args:
            question: User's question

        Returns:
            Answer indicating insufficient context
        """
        return (
            f"I couldn't find relevant information in the call transcripts to answer your question: \"{question}\"\n\n"
            "This could be because:\n"
            "- The topic hasn't been discussed in recent calls\n"
            "- The filters you applied are too restrictive\n"
            "- The question is about information not typically captured in call transcripts\n\n"
            "Try:\n"
            "- Broadening your search filters (e.g., remove date range or company filter)\n"
            "- Rephrasing your question\n"
            "- Asking about topics more commonly discussed in sales/support calls"
        )

    def format_sources(self, search_results: List[Dict[str, Any]]) -> List[SourceChunk]:
        """
        Format search results as SourceChunk objects.

        Args:
            search_results: Raw search results from OpenSearch

        Returns:
            List of SourceChunk objects
        """
        sources = []

        for result in search_results:
            source = SourceChunk(
                call_id=result['call_id'],
                chunk_id=result.get('chunk_id', f"{result['call_id']}_chunk_0"),
                score=result['score'],
                text=result['text'],
                metadata=result.get('metadata', {})
            )
            sources.append(source)

        return sources
