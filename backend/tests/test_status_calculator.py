"""
Unit tests for status_calculator.py
Tests automatic status calculation logic for rounds
"""
import pytest
from datetime import datetime, timedelta, timezone
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.status_calculator import calculate_round_status
from models_updated import RoundStatus


class TestStatusCalculator:
    """Test suite for round status calculation"""
    
    def test_completed_status_with_100_percent(self):
        """Round with 100% completion should be COMPLETED regardless of dates"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=5)
        deadline = datetime.now(timezone.utc) + timedelta(days=5)
        end_date = None
        completion = 100
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.COMPLETED.value
    
    def test_scheduled_status_future_scheduled_date(self):
        """Round with future scheduled date should be SCHEDULED"""
        scheduled = datetime.now(timezone.utc) + timedelta(days=5)
        deadline = datetime.now(timezone.utc) + timedelta(days=10)
        end_date = None
        completion = 0
        current = 'scheduled'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.SCHEDULED.value
    
    def test_overdue_status_past_deadline(self):
        """Round past deadline with incomplete work should be OVERDUE"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=10)
        deadline = datetime.now(timezone.utc) - timedelta(days=2)
        end_date = None
        completion = 50
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.OVERDUE.value
    
    def test_overdue_status_past_end_date(self):
        """Round past end_date (when no deadline) should be OVERDUE"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=10)
        deadline = None
        end_date = datetime.now(timezone.utc) - timedelta(days=2)
        completion = 30
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.OVERDUE.value
    
    def test_in_progress_status_started_with_progress(self):
        """Round that started with some progress should be IN_PROGRESS"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=2)
        deadline = datetime.now(timezone.utc) + timedelta(days=5)
        end_date = None
        completion = 30
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.IN_PROGRESS.value
    
    def test_in_progress_status_started_no_progress_already_in_progress(self):
        """Round that started with no progress but already IN_PROGRESS should remain IN_PROGRESS"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=1)
        deadline = datetime.now(timezone.utc) + timedelta(days=5)
        end_date = None
        completion = 0
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.IN_PROGRESS.value
    
    def test_scheduled_status_started_but_no_progress_not_in_progress(self):
        """Round that started with no progress and not yet IN_PROGRESS should be SCHEDULED"""
        scheduled = datetime.now(timezone.utc) - timedelta(hours=1)
        deadline = datetime.now(timezone.utc) + timedelta(days=5)
        end_date = None
        completion = 0
        current = 'scheduled'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.SCHEDULED.value
    
    def test_completed_overrides_overdue(self):
        """Completed round should remain COMPLETED even if past deadline"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=10)
        deadline = datetime.now(timezone.utc) - timedelta(days=5)
        end_date = None
        completion = 100
        current = 'completed'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.COMPLETED.value
    
    def test_deadline_takes_precedence_over_end_date(self):
        """When both deadline and end_date exist, deadline should be used"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=10)
        deadline = datetime.now(timezone.utc) - timedelta(days=2)  # Past (should trigger OVERDUE)
        end_date = datetime.now(timezone.utc) + timedelta(days=5)  # Future
        completion = 50
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.OVERDUE.value
    
    def test_none_deadline_and_end_date_not_overdue(self):
        """Round with no deadline or end_date should not be OVERDUE"""
        scheduled = datetime.now(timezone.utc) - timedelta(days=10)
        deadline = None
        end_date = None
        completion = 50
        current = 'in_progress'
        
        result = calculate_round_status(scheduled, deadline, end_date, completion, current)
        assert result == RoundStatus.IN_PROGRESS.value


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

