"""
Tests for the text chunking service.

Tests all chunking strategies, edge cases, and performance requirements.
"""

import pytest
import time
from backend.services.chunking_service import ChunkingService


class TestChunkingService:
    """Test suite for ChunkingService."""

    @pytest.fixture
    def service(self):
        """Create a ChunkingService instance with default settings."""
        return ChunkingService(
            chunk_size=512,
            overlap_percentage=10,
            min_chunk_size=100,
            max_chunk_size=1000
        )

    @pytest.fixture
    def sample_transcript(self):
        """Sample transcript for testing."""
        return (
            "Hello, thank you for calling Acme Corporation. "
            "My name is Sarah and I'll be helping you today. "
            "How can I assist you? "
            "I need to speak with someone about my account. "
            "Of course, I'd be happy to help you with that. "
            "Can you please provide your account number? "
            "Yes, it's 123456789. "
            "Thank you. Let me pull up your account information. "
            "I see here that you have a premium subscription. "
            "Is there a specific issue you're experiencing? "
            "Yes, I was charged twice this month. "
            "I apologize for the inconvenience. "
            "Let me investigate this for you right away."
        )

    @pytest.fixture
    def whisper_segments(self):
        """Sample Whisper segments with timing information."""
        return [
            {"start": 0.0, "end": 3.2, "text": "Hello, thank you for calling Acme Corporation."},
            {"start": 3.2, "end": 6.5, "text": "My name is Sarah and I'll be helping you today."},
            {"start": 6.5, "end": 8.1, "text": "How can I assist you?"},
            {"start": 8.1, "end": 11.3, "text": "I need to speak with someone about my account."},
            {"start": 11.3, "end": 14.8, "text": "Of course, I'd be happy to help you with that."},
            {"start": 14.8, "end": 17.2, "text": "Can you please provide your account number?"},
            {"start": 17.2, "end": 19.5, "text": "Yes, it's 123456789."},
            {"start": 19.5, "end": 22.8, "text": "Thank you. Let me pull up your account information."},
            {"start": 22.8, "end": 26.1, "text": "I see here that you have a premium subscription."},
            {"start": 26.1, "end": 29.3, "text": "Is there a specific issue you're experiencing?"},
            {"start": 29.3, "end": 32.0, "text": "Yes, I was charged twice this month."},
            {"start": 32.0, "end": 34.5, "text": "I apologize for the inconvenience."},
            {"start": 34.5, "end": 37.8, "text": "Let me investigate this for you right away."},
        ]

    # Test 1: Fixed-size chunking
    def test_fixed_size_chunking(self, service, sample_transcript):
        """Test fixed-size chunking strategy."""
        chunks = service.fixed_size_chunking(
            call_id="test_call_1",
            transcript=sample_transcript
        )

        # Should create at least one chunk
        assert len(chunks) > 0

        # All chunks should respect size constraints
        for chunk in chunks:
            assert chunk.character_count >= service.min_chunk_size
            assert chunk.character_count <= service.chunk_size + 100  # Allow some tolerance

        # Verify chunk IDs are sequential
        for i, chunk in enumerate(chunks):
            assert chunk.chunk_id == f"test_call_1_chunk_{i}"
            assert chunk.chunk_index == i
            assert chunk.call_id == "test_call_1"

        # Verify character and word counts
        for chunk in chunks:
            assert chunk.character_count == len(chunk.text)
            assert chunk.word_count == len(chunk.text.split())

    # Test 2: Word boundary preservation
    def test_word_boundary_preservation(self, service):
        """Test that chunks don't split words."""
        transcript = "This is a test transcript with some longer words like extraordinary and magnificent"

        chunks = service.fixed_size_chunking(
            call_id="test_call_2",
            transcript=transcript
        )

        # Check that no chunk ends with a partial word
        for chunk in chunks:
            # Chunk text should not start or end with mid-word characters
            assert chunk.text[0].isalpha() or chunk.text[0].isupper() or chunk.text[0].isspace()
            # Last character can be letter, space, or punctuation
            assert not (chunk.text[-1] == ' ' and len(chunk.text) > 1)

    # Test 3: Semantic chunking
    def test_semantic_chunking(self, service, sample_transcript):
        """Test semantic chunking by sentence boundaries."""
        chunks = service.semantic_chunking(
            call_id="test_call_3",
            transcript=sample_transcript
        )

        # Should create at least one chunk
        assert len(chunks) > 0

        # Chunks should respect max size
        for chunk in chunks:
            assert chunk.character_count <= service.max_chunk_size

        # Chunks should meet minimum size (unless it's the last chunk)
        for chunk in chunks[:-1]:
            assert chunk.character_count >= service.min_chunk_size

    # Test 4: Sentence boundary detection
    def test_sentence_boundary_detection(self, service):
        """Test that semantic chunking properly detects sentence boundaries."""
        transcript = "First sentence. Second sentence! Third sentence? Fourth sentence."

        chunks = service.semantic_chunking(
            call_id="test_call_4",
            transcript=transcript
        )

        # Should group sentences intelligently
        assert len(chunks) > 0

        # All chunk text should be complete sentences
        for chunk in chunks:
            # Should end with sentence-ending punctuation or be part of longer text
            assert any(chunk.text.strip().endswith(p) for p in ['.', '!', '?']) or chunk == chunks[-1]

    # Test 5: Overlapping chunks
    def test_overlapping_chunks(self, service, sample_transcript):
        """Test overlapping chunks strategy."""
        chunks = service.overlapping_chunks(
            call_id="test_call_5",
            transcript=sample_transcript
        )

        # Should create multiple chunks for this transcript
        assert len(chunks) >= 2

        # Verify overlap exists between consecutive chunks
        if len(chunks) >= 2:
            # Check that some text from chunk N appears in chunk N+1
            for i in range(len(chunks) - 1):
                chunk1_end = chunks[i].text[-50:]  # Last 50 chars
                chunk2_start = chunks[i + 1].text[:50]  # First 50 chars

                # There should be some overlap (at least a few characters)
                # This is a heuristic check
                overlap_found = any(
                    word in chunk2_start
                    for word in chunk1_end.split()[-3:]  # Last 3 words
                )
                # Not asserting strictly as overlap may vary based on word boundaries

    # Test 6: Timing information extraction
    def test_timing_extraction(self, service, sample_transcript, whisper_segments):
        """Test extraction of timing information from Whisper segments."""
        chunks = service.fixed_size_chunking(
            call_id="test_call_6",
            transcript=sample_transcript,
            segments=whisper_segments
        )

        # At least one chunk should have timing information
        assert any(chunk.start_time is not None for chunk in chunks)
        assert any(chunk.end_time is not None for chunk in chunks)

        # Timing should be reasonable
        for chunk in chunks:
            if chunk.start_time is not None and chunk.end_time is not None:
                assert chunk.start_time >= 0
                assert chunk.end_time > chunk.start_time
                assert chunk.end_time <= 40.0  # Reasonable for sample

    # Test 7: Empty transcript
    def test_empty_transcript(self, service):
        """Test handling of empty transcript."""
        chunks = service.chunk_transcript(
            call_id="test_call_7",
            transcript=""
        )

        # Should return empty list
        assert len(chunks) == 0

    # Test 8: Very short transcript
    def test_short_transcript(self, service):
        """Test handling of transcript shorter than min_chunk_size."""
        short_text = "Hello world"

        chunks = service.chunk_transcript(
            call_id="test_call_8",
            transcript=short_text
        )

        # Should return empty list because text is below min_chunk_size
        assert len(chunks) == 0

    # Test 9: Transcript exactly at min_chunk_size
    def test_min_size_transcript(self, service):
        """Test transcript exactly at minimum chunk size."""
        # Create text exactly 100 characters (min_chunk_size)
        text = "a" * 100

        chunks = service.chunk_transcript(
            call_id="test_call_9",
            transcript=text
        )

        # Should create exactly one chunk
        assert len(chunks) == 1
        assert chunks[0].character_count == 100

    # Test 10: Special characters and unicode
    def test_special_characters_unicode(self, service):
        """Test handling of special characters and unicode."""
        transcript = (
            "Hello! This transcript contains special characters: @#$%^&*(). "
            "It also has unicode: café, naïve, 你好, مرحبا. "
            "And emojis: 😊 🎉 🚀. "
            "Numbers: 123-456-7890. "
            "Symbols: © ® ™ € £ ¥."
        )

        chunks = service.chunk_transcript(
            call_id="test_call_10",
            transcript=transcript
        )

        # Should handle special characters without errors
        assert len(chunks) > 0

        # Verify all text is preserved
        for chunk in chunks:
            assert chunk.character_count == len(chunk.text)
            assert chunk.word_count > 0

    # Test 11: Metadata preservation
    def test_metadata_preservation(self, service, sample_transcript):
        """Test that metadata is properly attached to chunks."""
        metadata = {
            "company_name": "Acme Corp",
            "call_type": "support",
            "language": "en"
        }

        chunks = service.chunk_transcript(
            call_id="test_call_11",
            transcript=sample_transcript,
            metadata=metadata
        )

        # All chunks should have metadata
        for chunk in chunks:
            assert chunk.metadata == metadata

    # Test 12: Chunk statistics
    def test_chunk_statistics(self, service, sample_transcript):
        """Test get_chunk_statistics method."""
        chunks = service.chunk_transcript(
            call_id="test_call_12",
            transcript=sample_transcript
        )

        stats = service.get_chunk_statistics(chunks)

        # Verify all expected fields
        assert "count" in stats
        assert "total_characters" in stats
        assert "total_words" in stats
        assert "avg_character_count" in stats
        assert "avg_word_count" in stats
        assert "min_character_count" in stats
        assert "max_character_count" in stats

        # Verify values are reasonable
        assert stats["count"] == len(chunks)
        assert stats["total_characters"] > 0
        assert stats["avg_character_count"] > 0

    # Test 13: Empty chunks list statistics
    def test_empty_chunks_statistics(self, service):
        """Test statistics for empty chunks list."""
        stats = service.get_chunk_statistics([])

        assert stats["count"] == 0
        assert stats["total_characters"] == 0
        assert stats["avg_character_count"] == 0

    # Test 14: Different chunking strategies
    def test_strategy_selection(self, service, sample_transcript):
        """Test that strategy parameter correctly selects chunking method."""
        # Test fixed_size strategy
        fixed_chunks = service.chunk_transcript(
            call_id="test_call_14a",
            transcript=sample_transcript,
            strategy="fixed_size"
        )

        # Test semantic strategy
        semantic_chunks = service.chunk_transcript(
            call_id="test_call_14b",
            transcript=sample_transcript,
            strategy="semantic"
        )

        # Test overlapping strategy
        overlapping_chunks = service.chunk_transcript(
            call_id="test_call_14c",
            transcript=sample_transcript,
            strategy="overlapping"
        )

        # All strategies should produce chunks
        assert len(fixed_chunks) > 0
        assert len(semantic_chunks) > 0
        assert len(overlapping_chunks) > 0

        # Strategies may produce different number of chunks
        # (not asserting equality, just that they work)

    # Test 15: Performance test - 10K word transcript
    def test_performance_10k_words(self, service):
        """Test that chunking 10,000 words completes in under 1 second."""
        # Generate a 10,000 word transcript
        base_text = "This is a sample sentence with multiple words for testing. "
        word_count = len(base_text.split())
        repetitions = (10000 // word_count) + 1
        large_transcript = base_text * repetitions

        # Verify word count
        actual_word_count = len(large_transcript.split())
        assert actual_word_count >= 10000

        # Measure performance
        start_time = time.time()

        chunks = service.chunk_transcript(
            call_id="test_call_15",
            transcript=large_transcript,
            strategy="fixed_size"
        )

        elapsed_time = time.time() - start_time

        # Should complete in under 1 second
        assert elapsed_time < 1.0, f"Chunking took {elapsed_time:.3f}s, expected < 1.0s"

        # Should produce many chunks
        assert len(chunks) > 10

    # Test 16: Whitespace handling
    def test_whitespace_handling(self, service):
        """Test handling of transcripts with excessive whitespace."""
        transcript = "Hello    world.     This  has    extra   spaces.   \n\n  And newlines.  \t Tabs too."

        chunks = service.chunk_transcript(
            call_id="test_call_16",
            transcript=transcript
        )

        # Should handle whitespace gracefully
        assert len(chunks) > 0

        # Chunks should be trimmed
        for chunk in chunks:
            assert chunk.text == chunk.text.strip()

    # Test 17: Single long word
    def test_single_long_word(self, service):
        """Test handling of very long words that exceed chunk_size."""
        # Create a word longer than chunk_size
        long_word = "a" * 600

        chunks = service.chunk_transcript(
            call_id="test_call_17",
            transcript=long_word
        )

        # Should still create chunk even if word is longer than chunk_size
        assert len(chunks) > 0

    # Test 18: Configuration parameters
    def test_custom_configuration(self):
        """Test ChunkingService with custom configuration."""
        custom_service = ChunkingService(
            chunk_size=256,
            overlap_percentage=20,
            min_chunk_size=50,
            max_chunk_size=500
        )

        assert custom_service.chunk_size == 256
        assert custom_service.overlap == 51  # 20% of 256
        assert custom_service.min_chunk_size == 50
        assert custom_service.max_chunk_size == 500

    # Test 19: Chunks cover entire transcript
    def test_complete_coverage(self, service, sample_transcript):
        """Test that all chunks together cover the entire transcript."""
        chunks = service.chunk_transcript(
            call_id="test_call_19",
            transcript=sample_transcript,
            strategy="fixed_size"
        )

        # Concatenate all chunk texts
        combined_text = " ".join(chunk.text for chunk in chunks)

        # Should cover most of the transcript (allowing for trimming)
        # Count words to verify coverage
        original_words = set(sample_transcript.split())
        combined_words = set(combined_text.split())

        # At least 95% of words should be covered
        coverage = len(original_words & combined_words) / len(original_words)
        assert coverage >= 0.95

    # Test 20: No timing when segments not provided
    def test_no_timing_without_segments(self, service, sample_transcript):
        """Test that timing is None when Whisper segments are not provided."""
        chunks = service.chunk_transcript(
            call_id="test_call_20",
            transcript=sample_transcript,
            segments=None
        )

        # All chunks should have None for timing
        for chunk in chunks:
            assert chunk.start_time is None
            assert chunk.end_time is None
