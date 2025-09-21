import React from 'react';

const FontShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-display font-aws-pro text-gray-900 dark:text-white mb-4">
            عرض خطوط AWS Pro
          </h1>
          <p className="text-body-large font-aws-pro text-gray-600 dark:text-gray-300">
            نظام خطوط متقدم يدعم العربية والإنجليزية
          </p>
        </div>

        {/* Typography Scale */}
        <div className="aws-card">
          <h2 className="aws-heading mb-6">مقياس الخطوط</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-display font-aws-pro text-gray-900 dark:text-white">
                Display Text (3.5rem)
              </h3>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-display - للعناوين الرئيسية الكبيرة
              </p>
            </div>
            
            <div>
              <h3 className="text-heading-1 font-aws-pro text-gray-900 dark:text-white">
                Heading 1 (2.5rem)
              </h3>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-heading-1 - للعناوين الرئيسية
              </p>
            </div>
            
            <div>
              <h3 className="text-heading-2 font-aws-pro text-gray-900 dark:text-white">
                Heading 2 (2rem)
              </h3>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-heading-2 - للعناوين الفرعية
              </p>
            </div>
            
            <div>
              <h3 className="text-heading-3 font-aws-pro text-gray-900 dark:text-white">
                Heading 3 (1.5rem)
              </h3>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-heading-3 - للعناوين الصغيرة
              </p>
            </div>
            
            <div>
              <p className="text-body-large font-aws-pro text-gray-700 dark:text-gray-200">
                Body Large (1.125rem) - نص كبير للقراءة المهمة
              </p>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-body-large - للنصوص المهمة
              </p>
            </div>
            
            <div>
              <p className="text-body font-aws-pro text-gray-700 dark:text-gray-200">
                Body (1rem) - نص أساسي للقراءة العادية
              </p>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-body - للنصوص الأساسية
              </p>
            </div>
            
            <div>
              <p className="text-body-small font-aws-pro text-gray-700 dark:text-gray-200">
                Body Small (0.875rem) - نص صغير للتفاصيل
              </p>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-body-small - للنصوص الصغيرة
              </p>
            </div>
            
            <div>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                Caption (0.75rem) - نص توضيحي
              </p>
              <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
                .text-caption - للنصوص التوضيحية
              </p>
            </div>
          </div>
        </div>

        {/* Font Weights */}
        <div className="aws-card">
          <h2 className="aws-heading mb-6">أوزان الخطوط</h2>
          <div className="space-y-3">
            <p className="text-body font-aws-pro font-thin text-gray-700 dark:text-gray-200">
              Thin (100) - خط رفيع جداً
            </p>
            <p className="text-body font-aws-pro font-extralight text-gray-700 dark:text-gray-200">
              Extra Light (200) - خط رفيع جداً
            </p>
            <p className="text-body font-aws-pro font-light text-gray-700 dark:text-gray-200">
              Light (300) - خط رفيع
            </p>
            <p className="text-body font-aws-pro font-normal text-gray-700 dark:text-gray-200">
              Normal (400) - خط عادي
            </p>
            <p className="text-body font-aws-pro font-medium text-gray-700 dark:text-gray-200">
              Medium (500) - خط متوسط
            </p>
            <p className="text-body font-aws-pro font-semibold text-gray-700 dark:text-gray-200">
              Semibold (600) - خط شبه عريض
            </p>
            <p className="text-body font-aws-pro font-bold text-gray-700 dark:text-gray-200">
              Bold (700) - خط عريض
            </p>
            <p className="text-body font-aws-pro font-extrabold text-gray-700 dark:text-gray-200">
              Extra Bold (800) - خط عريض جداً
            </p>
            <p className="text-body font-aws-pro font-black text-gray-700 dark:text-gray-200">
              Black (900) - خط أسود
            </p>
          </div>
        </div>

        {/* Code Font */}
        <div className="aws-card">
          <h2 className="aws-heading mb-6">خط الكود (JetBrains Mono)</h2>
          <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
            <code className="text-code font-aws-pro-mono text-gray-800 dark:text-gray-200">
              const example = "Hello World";<br/>
              function greet(name: string) &#123;<br/>
              &nbsp;&nbsp;return `Hello, $&#123;name&#125;!`;<br/>
              &#125;
            </code>
          </div>
          <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400 mt-2">
            .text-code .font-aws-pro-mono - للأكواد والمعرفات
          </p>
        </div>

        {/* Component Examples */}
        <div className="aws-card">
          <h2 className="aws-heading mb-6">أمثلة المكونات</h2>
          <div className="space-y-4">
            <div>
              <h3 className="aws-subheading mb-2">بطاقة بتنسيق AWS Pro</h3>
              <div className="aws-card bg-blue-50 dark:bg-blue-900/20">
                <h4 className="aws-heading text-blue-900 dark:text-blue-100">عنوان البطاقة</h4>
                <p className="aws-body text-blue-800 dark:text-blue-200">
                  هذا مثال على بطاقة تستخدم تنسيق AWS Pro مع ألوان مخصصة.
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="aws-button bg-blue-600 hover:bg-blue-700 text-white">
                    زر أساسي
                  </button>
                  <button className="aws-button bg-gray-200 hover:bg-gray-300 text-gray-800">
                    زر ثانوي
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="aws-subheading mb-2">حقل إدخال</h3>
              <input 
                type="text" 
                placeholder="أدخل النص هنا..." 
                className="aws-input"
              />
            </div>
          </div>
        </div>

        {/* Arabic Text Example */}
        <div className="aws-card">
          <h2 className="aws-heading mb-6">مثال على النص العربي</h2>
          <div className="space-y-4">
            <p className="text-body font-aws-pro text-gray-700 dark:text-gray-200">
              هذا مثال على النص العربي باستخدام خطوط AWS Pro. الخط يدعم اللغة العربية بشكل ممتاز ويوفر وضوحاً عالياً في القراءة.
            </p>
            <p className="text-body-large font-aws-pro text-gray-700 dark:text-gray-200">
              يمكن استخدام أحجام مختلفة من الخطوط لإنشاء تدرج هرمي واضح في المحتوى.
            </p>
            <p className="text-caption font-aws-pro text-gray-500 dark:text-gray-400">
              النص التوضيحي يمكن أن يكون مفيداً لتقديم معلومات إضافية أو توضيحات.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontShowcase;
