"""
Text chunking service for call transcripts.

Implements multiple chunking strategies to break down transcripts into
optimal-sized segments for embedding generation and semantic search.
"""

import re
from typing import List, Dict, Any, Optional
from backend.models.chunk import Chunk


class ChunkingService:
    """
    Service for chunking call transcripts into optimal-sized segments.

    Supports multiple chunking strategies:
    - Fixed-size chunking: Split by character count with word boundary respect
    - Semantic chunking: Split by sentence boundaries
    - Overlapping chunks: Add overlap between consecutive chunks

    Preserves timing information from Whisper segments when available.
    """

    def __init__(
        self,
        chunk_size: int = 512,
        overlap_percentage: int = 10,
        min_chunk_size: int = 100,
        max_chunk_size: int = 1000
    ):
        """
        Initialize the chunking service.

        Args:
            chunk_size: Target size for chunks in characters (default: 512)
            overlap_percentage: Percentage of overlap between chunks (default: 10)
            min_chunk_size: Minimum chunk size in characters (default: 100)
            max_chunk_size: Maximum chunk size in characters (default: 1000)
        """
        self.chunk_size = chunk_size
        self.overlap = int(chunk_size * overlap_percentage / 100)
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size

        # Sentence boundary regex (matches ., !, ? followed by space or end of string)
        self.sentence_pattern = re.compile(r'(?<=[.!?])\s+(?=[A-Z])')

    def chunk_transcript(
        self,
        call_id: str,
        transcript: str,
        segments: Optional[List[Dict[str, Any]]] = None,
        strategy: str = "fixed_size",
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Chunk]:
        """
        Chunk a transcript using the specified strategy.

        Args:
            call_id: Unique identifier for the call
            transcript: The full transcript text to chunk
            segments: Whisper segments with timing information (optional)
            strategy: Chunking strategy - "fixed_size", "semantic", or "overlapping"
            metadata: Additional metadata to attach to chunks

        Returns:
            List of Chunk objects with text and timing information
        """
        if not transcript or len(transcript.strip()) == 0:
            return []

        # Choose chunking strategy
        if strategy == "semantic":
            return self.semantic_chunking(call_id, transcript, segments, metadata)
        elif strategy == "overlapping":
            return self.overlapping_chunks(call_id, transcript, segments, metadata)
        else:  # Default to fixed_size
            return self.fixed_size_chunking(call_id, transcript, segments, metadata)

    def fixed_size_chunking(
        self,
        call_id: str,
        transcript: str,
        segments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Chunk]:
        """
        Split transcript into fixed-size chunks, respecting word boundaries.

        Args:
            call_id: Unique identifier for the call
            transcript: The full transcript text
            segments: Whisper segments with timing information (optional)
            metadata: Additional metadata to attach to chunks

        Returns:
            List of fixed-size Chunk objects
        """
        chunks = []
        start_pos = 0
        chunk_index = 0

        while start_pos < len(transcript):
            # Find chunk end position
            end_pos = min(start_pos + self.chunk_size, len(transcript))

            # Respect word boundaries - find last space before end_pos
            if end_pos < len(transcript) and transcript[end_pos] != ' ':
                # Look backwards for a space
                space_pos = transcript.rfind(' ', start_pos, end_pos)
                if space_pos > start_pos:
                    end_pos = space_pos

            # Extract chunk text
            chunk_text = transcript[start_pos:end_pos].strip()

            # Only create chunk if it meets minimum size
            if len(chunk_text) >= self.min_chunk_size:
                # Get timing information from Whisper segments
                start_time, end_time = self._get_timing(start_pos, end_pos, transcript, segments)

                chunk = Chunk(
                    chunk_id=f"{call_id}_chunk_{chunk_index}",
                    call_id=call_id,
                    chunk_index=chunk_index,
                    text=chunk_text,
                    character_count=len(chunk_text),
                    word_count=len(chunk_text.split()),
                    start_time=start_time,
                    end_time=end_time,
                    metadata=metadata or {}
                )
                chunks.append(chunk)
                chunk_index += 1

            # Move to next chunk
            start_pos = end_pos + 1

        return chunks

    def semantic_chunking(
        self,
        call_id: str,
        transcript: str,
        segments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Chunk]:
        """
        Split transcript by sentence boundaries for semantic coherence.

        Args:
            call_id: Unique identifier for the call
            transcript: The full transcript text
            segments: Whisper segments with timing information (optional)
            metadata: Additional metadata to attach to chunks

        Returns:
            List of semantically coherent Chunk objects
        """
        # Split into sentences
        sentences = self.sentence_pattern.split(transcript)

        chunks = []
        current_chunk_text = ""
        current_chunk_start_pos = 0
        chunk_index = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # Check if adding this sentence would exceed max chunk size
            potential_text = (current_chunk_text + " " + sentence).strip() if current_chunk_text else sentence

            if len(potential_text) > self.max_chunk_size and current_chunk_text:
                # Save current chunk and start new one
                if len(current_chunk_text) >= self.min_chunk_size:
                    chunk_end_pos = current_chunk_start_pos + len(current_chunk_text)
                    start_time, end_time = self._get_timing(
                        current_chunk_start_pos, chunk_end_pos, transcript, segments
                    )

                    chunk = Chunk(
                        chunk_id=f"{call_id}_chunk_{chunk_index}",
                        call_id=call_id,
                        chunk_index=chunk_index,
                        text=current_chunk_text,
                        character_count=len(current_chunk_text),
                        word_count=len(current_chunk_text.split()),
                        start_time=start_time,
                        end_time=end_time,
                        metadata=metadata or {}
                    )
                    chunks.append(chunk)
                    chunk_index += 1

                # Start new chunk with current sentence
                current_chunk_start_pos = chunk_end_pos + 1
                current_chunk_text = sentence
            else:
                # Add sentence to current chunk
                current_chunk_text = potential_text

        # Add final chunk
        if current_chunk_text and len(current_chunk_text) >= self.min_chunk_size:
            chunk_end_pos = current_chunk_start_pos + len(current_chunk_text)
            start_time, end_time = self._get_timing(
                current_chunk_start_pos, chunk_end_pos, transcript, segments
            )

            chunk = Chunk(
                chunk_id=f"{call_id}_chunk_{chunk_index}",
                call_id=call_id,
                chunk_index=chunk_index,
                text=current_chunk_text,
                character_count=len(current_chunk_text),
                word_count=len(current_chunk_text.split()),
                start_time=start_time,
                end_time=end_time,
                metadata=metadata or {}
            )
            chunks.append(chunk)

        return chunks

    def overlapping_chunks(
        self,
        call_id: str,
        transcript: str,
        segments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Chunk]:
        """
        Create overlapping chunks to capture context at boundaries.

        Args:
            call_id: Unique identifier for the call
            transcript: The full transcript text
            segments: Whisper segments with timing information (optional)
            metadata: Additional metadata to attach to chunks

        Returns:
            List of overlapping Chunk objects
        """
        chunks = []
        start_pos = 0
        chunk_index = 0

        while start_pos < len(transcript):
            # Find chunk end position
            end_pos = min(start_pos + self.chunk_size, len(transcript))

            # Respect word boundaries
            if end_pos < len(transcript) and transcript[end_pos] != ' ':
                space_pos = transcript.rfind(' ', start_pos, end_pos)
                if space_pos > start_pos:
                    end_pos = space_pos

            # Extract chunk text
            chunk_text = transcript[start_pos:end_pos].strip()

            # Only create chunk if it meets minimum size
            if len(chunk_text) >= self.min_chunk_size:
                # Get timing information
                start_time, end_time = self._get_timing(start_pos, end_pos, transcript, segments)

                chunk = Chunk(
                    chunk_id=f"{call_id}_chunk_{chunk_index}",
                    call_id=call_id,
                    chunk_index=chunk_index,
                    text=chunk_text,
                    character_count=len(chunk_text),
                    word_count=len(chunk_text.split()),
                    start_time=start_time,
                    end_time=end_time,
                    metadata=metadata or {}
                )
                chunks.append(chunk)
                chunk_index += 1

            # Move to next chunk with overlap
            if self.overlap > 0 and end_pos < len(transcript):
                start_pos = end_pos - self.overlap
            else:
                start_pos = end_pos + 1

        return chunks

    def _get_timing(
        self,
        start_char: int,
        end_char: int,
        transcript: str,
        segments: Optional[List[Dict[str, Any]]]
    ) -> tuple[Optional[float], Optional[float]]:
        """
        Extract timing information from Whisper segments for a chunk.

        Maps character positions in the transcript to Whisper segment timestamps.

        Args:
            start_char: Starting character position in transcript
            end_char: Ending character position in transcript
            transcript: Full transcript text
            segments: Whisper segments with 'start', 'end', and 'text' fields

        Returns:
            Tuple of (start_time, end_time) in seconds, or (None, None) if unavailable
        """
        if not segments:
            return None, None

        # Build character position map for segments
        char_pos = 0
        start_time = None
        end_time = None

        for segment in segments:
            segment_text = segment.get('text', '')
            segment_start = char_pos
            segment_end = char_pos + len(segment_text)

            # Check if this segment overlaps with our chunk
            if segment_end >= start_char and segment_start <= end_char:
                # Update start_time if this is the first matching segment
                if start_time is None:
                    start_time = segment.get('start')

                # Always update end_time to the latest matching segment
                end_time = segment.get('end')

            # Move character position forward (account for space between segments)
            char_pos = segment_end + 1

            # Break early if we've passed the chunk
            if segment_start > end_char:
                break

        return start_time, end_time

    def get_chunk_statistics(self, chunks: List[Chunk]) -> Dict[str, Any]:
        """
        Calculate statistics about a list of chunks.

        Args:
            chunks: List of Chunk objects

        Returns:
            Dictionary with statistics (count, avg size, min/max sizes, etc.)
        """
        if not chunks:
            return {
                "count": 0,
                "total_characters": 0,
                "total_words": 0,
                "avg_character_count": 0,
                "avg_word_count": 0,
                "min_character_count": 0,
                "max_character_count": 0,
            }

        char_counts = [chunk.character_count for chunk in chunks]
        word_counts = [chunk.word_count for chunk in chunks]

        return {
            "count": len(chunks),
            "total_characters": sum(char_counts),
            "total_words": sum(word_counts),
            "avg_character_count": sum(char_counts) / len(chunks),
            "avg_word_count": sum(word_counts) / len(chunks),
            "min_character_count": min(char_counts),
            "max_character_count": max(char_counts),
            "has_timing": any(chunk.start_time is not None for chunk in chunks),
        }
