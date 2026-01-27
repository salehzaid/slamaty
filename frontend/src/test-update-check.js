// اختبار التحديثات
console.log('🔄 تم تحميل ملف الاختبار في:', new Date().toISOString());

// التحقق من وجود زر بدء خطة التصحيح
setTimeout(() => {
  const startButtons = document.querySelectorAll('button');
  const capaButtons = Array.from(startButtons).filter(btn => 
    btn.textContent.includes('بدء خطة التصحيح')
  );
  
  console.log('🔍 عدد أزرار "بدء خطة التصحيح" الموجودة:', capaButtons.length);
  
  if (capaButtons.length > 0) {
    console.log('✅ تم العثور على أزرار بدء خطة التصحيح!');
    capaButtons.forEach((btn, index) => {
      console.log(`زر ${index + 1}:`, btn.textContent.trim());
    });
  } else {
    console.log('❌ لم يتم العثور على أزرار بدء خطة التصحيح');
    console.log('📋 جميع الأزرار الموجودة:', Array.from(startButtons).map(btn => btn.textContent.trim()));
  }
}, 2000);

// التحقق من وجود معلومات القسم والمسؤول
setTimeout(() => {
  const departmentInfo = document.querySelectorAll('[class*="bg-gray-50"]');
  console.log('🏢 عدد مربعات معلومات القسم:', departmentInfo.length);
  
  if (departmentInfo.length > 0) {
    console.log('✅ تم العثور على معلومات القسم والمسؤول!');
  } else {
    console.log('❌ لم يتم العثور على معلومات القسم والمسؤول');
  }
}, 3000);
