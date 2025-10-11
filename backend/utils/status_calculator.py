"""
Status Calculator for Rounds
Automatically calculates round status based on dates and completion percentage
"""
from datetime import datetime, timezone
from typing import Optional
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models_updated import RoundStatus


def calculate_round_status(
    scheduled_date: Optional[datetime],
    deadline: Optional[datetime],
    end_date: Optional[datetime],
    completion_percentage: int,
    current_status: str
) -> str:
    """
    حساب حالة الجولة التلقائية بناءً على البيانات
    
    القواعد:
    1. إذا completion_percentage >= 100 → completed
    2. إذا scheduled_date في المستقبل → scheduled
    3. إذا مضت المهلة ولم تكتمل → overdue
    4. إذا بدأت ولم تتأخر → in_progress
    5. Default → scheduled
    
    Args:
        scheduled_date: تاريخ بدء الجولة
        deadline: تاريخ المهلة (اختياري)
        end_date: تاريخ الانتهاء المحسوب (اختياري)
        completion_percentage: نسبة الإنجاز (0-100)
        current_status: الحالة الحالية للجولة
        
    Returns:
        str: الحالة المحسوبة (قيمة من RoundStatus)
    """
    # Get current time in UTC
    now = datetime.now(timezone.utc)
    
    # Ensure completion_percentage is valid
    completion_percentage = completion_percentage or 0
    
    # Rule 1: إذا اكتملت → completed
    if completion_percentage >= 100:
        return RoundStatus.COMPLETED.value
    
    # Handle timezone-aware/naive datetime comparison
    if scheduled_date:
        # Make scheduled_date timezone-aware if it's naive
        if scheduled_date.tzinfo is None:
            scheduled_date = scheduled_date.replace(tzinfo=timezone.utc)
        
        # Rule 2: إذا لم تبدأ بعد → scheduled
        if scheduled_date > now:
            return RoundStatus.SCHEDULED.value
    
    # Rule 3: تحديد المهلة الفعلية
    effective_deadline = deadline or end_date
    
    if effective_deadline:
        # Make effective_deadline timezone-aware if it's naive
        if effective_deadline.tzinfo is None:
            effective_deadline = effective_deadline.replace(tzinfo=timezone.utc)
        
        # Rule 4: إذا تأخرت → overdue
        if effective_deadline < now and completion_percentage < 100:
            return RoundStatus.OVERDUE.value
    
    # Rule 5: إذا بدأت ولم تتأخر → in_progress
    if scheduled_date and scheduled_date <= now:
        # تحقق إذا بدأ المستخدم فعلياً (الحالة الحالية in_progress أو نسبة الإنجاز > 0)
        if current_status == RoundStatus.IN_PROGRESS.value or completion_percentage > 0:
            return RoundStatus.IN_PROGRESS.value
    
    # Rule 6: Default - scheduled
    # هذا يحدث إذا كانت الجولة بدأت ولكن لم يبدأ المستخدم العمل عليها بعد
    return RoundStatus.SCHEDULED.value


def get_days_until_deadline(deadline: Optional[datetime]) -> Optional[int]:
    """
    حساب عدد الأيام المتبقية حتى المهلة
    
    Args:
        deadline: تاريخ المهلة
        
    Returns:
        int: عدد الأيام (موجب للمستقبل، سالب للماضي) أو None
    """
    if not deadline:
        return None
    
    now = datetime.now(timezone.utc)
    
    # Make deadline timezone-aware if it's naive
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    
    delta = deadline - now
    return delta.days


def get_days_overdue(deadline: Optional[datetime]) -> Optional[int]:
    """
    حساب عدد أيام التأخير
    
    Args:
        deadline: تاريخ المهلة
        
    Returns:
        int: عدد أيام التأخير (موجب) أو None إذا لم تتأخر
    """
    if not deadline:
        return None
    
    days_until = get_days_until_deadline(deadline)
    if days_until is None or days_until >= 0:
        return None
    
    return abs(days_until)


def should_send_reminder(
    scheduled_date: Optional[datetime],
    deadline: Optional[datetime],
    status: str,
    completion_percentage: int
) -> bool:
    """
    تحديد ما إذا كان يجب إرسال تذكير للمستخدم
    
    التذكيرات تُرسل في الحالات التالية:
    - الجولة مجدولة وتبدأ خلال 2-3 أيام
    - الجولة قيد التنفيذ وتنتهي خلال 2-3 أيام
    - الجولة متأخرة
    
    Args:
        scheduled_date: تاريخ بدء الجولة
        deadline: تاريخ المهلة
        status: حالة الجولة
        completion_percentage: نسبة الإنجاز
        
    Returns:
        bool: True إذا كان يجب إرسال تذكير
    """
    if completion_percentage >= 100:
        return False
    
    # Reminder for overdue rounds
    if status == RoundStatus.OVERDUE.value:
        return True
    
    # Reminder for scheduled rounds starting soon
    if status == RoundStatus.SCHEDULED.value and scheduled_date:
        days_until_start = get_days_until_deadline(scheduled_date)
        if days_until_start is not None and 0 < days_until_start <= 3:
            return True
    
    # Reminder for in-progress rounds approaching deadline
    if status == RoundStatus.IN_PROGRESS.value and deadline:
        days_until_deadline = get_days_until_deadline(deadline)
        if days_until_deadline is not None and 0 < days_until_deadline <= 3:
            return True
    
    return False

