import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Hello from send-push-notification Function!");

Deno.serve(async (req) => {
  try {
    // 1. إنشاء عميل Supabase للوصول إلى قاعدة البيانات
    // يجب أن يكون هذا العميل لديه صلاحيات الأدمن للوصول إلى كل الجداول
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. استلام بيانات الرسالة الجديدة من المُحفّز (Trigger)
    const payload = await req.json();
    const newMessage = payload.record;

    // 3. جلب معلومات المرسل والمستقبل
    // جلب اسم المرسل
    const { data: senderData, error: senderError } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', newMessage.sender_id)
      .single(); // [تحسين] ضمان جلب مستخدم واحد فقط وجعل الكود أكثر أماناً

    if (senderError) throw senderError;

    // [تعديل] جلب جميع المستلمين في المحادثة (للتعامل مع المحادثات الفردية والجماعية)
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', newMessage.conversation_id)
      .neq('user_id', newMessage.sender_id); // استبعاد المرسل

    if (recipientsError) throw recipientsError;

    // [تعديل] المرور على كل مستلم وإرسال الإشعارات
    for (const recipient of recipients) {
      const recipientId = recipient.user_id;

      // 4. جلب كل الـ Push Tokens الخاصة بالمستقبل
      const { data: tokens, error: tokensError } = await supabaseAdmin
        .from('push_tokens')
        .select('token')
        .eq('user_id', recipientId);

      if (tokensError) {
        console.error(`Error fetching tokens for user ${recipientId}:`, tokensError);
        continue; // الانتقال إلى المستلم التالي في حالة وجود خطأ
      }

      // 5. إرسال الإشعار إذا كان هناك tokens
      if (tokens && tokens.length > 0) {
        const pushTokens = tokens.map(t => t.token);
        const notificationBody = newMessage.message_type === 'image' 
          ? '📷 صورة' 
          : newMessage.content;

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify({
            to: pushTokens,
            title: `رسالة جديدة من ${senderData.username}`,
            body: notificationBody,
            data: { conversationId: newMessage.conversation_id },
          }),
        });

        console.log(`Notification sent to user ${recipientId} with tokens:`, pushTokens);
      }
    }


    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in push notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
