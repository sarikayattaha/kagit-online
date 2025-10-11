import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const orderData: OrderEmailData = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #1f2937; }
          .value { color: #4b5563; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Yeni Sipariş Alındı</h1>
          </div>
          <div class="content">
            <div class="section">
              <h2>Müşteri Bilgileri</h2>
              <p><span class="label">Ad Soyad:</span> <span class="value">${orderData.customerName}</span></p>
              <p><span class="label">E-posta:</span> <span class="value">${orderData.customerEmail}</span></p>
              <p><span class="label">Şirket:</span> <span class="value">${orderData.customerCompany}</span></p>
            </div>
            
            <div class="section">
              <h2>Ürün Bilgileri</h2>
              <p><span class="label">Ürün:</span> <span class="value">${orderData.productName}</span></p>
              <p><span class="label">Miktar:</span> <span class="value">${orderData.quantity} adet</span></p>
              <p><span class="label">Birim Fiyat:</span> <span class="value">${orderData.unitPrice.toFixed(2)} TL</span></p>
              <p><span class="label">Toplam Fiyat:</span> <span class="value">${orderData.totalPrice.toFixed(2)} TL</span></p>
            </div>
            
            <div class="section">
              <h2>Teslimat Bilgileri</h2>
              <p><span class="label">Adres:</span> <span class="value">${orderData.shippingAddress}</span></p>
              <p><span class="label">Şehir:</span> <span class="value">${orderData.shippingCity}</span></p>
              <p><span class="label">Posta Kodu:</span> <span class="value">${orderData.shippingPostalCode}</span></p>
            </div>
            
            ${orderData.notes ? `
            <div class="section">
              <h2>Notlar</h2>
              <p class="value">${orderData.notes}</p>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Bu e-posta kagit.online üzerinden otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Yeni Sipariş Alındı

Müşteri Bilgileri:
Ad Soyad: ${orderData.customerName}
E-posta: ${orderData.customerEmail}
Şirket: ${orderData.customerCompany}

Ürün Bilgileri:
Ürün: ${orderData.productName}
Miktar: ${orderData.quantity} adet
Birim Fiyat: ${orderData.unitPrice.toFixed(2)} TL
Toplam Fiyat: ${orderData.totalPrice.toFixed(2)} TL

Teslimat Bilgileri:
Adres: ${orderData.shippingAddress}
Şehir: ${orderData.shippingCity}
Posta Kodu: ${orderData.shippingPostalCode}
${orderData.notes ? `\nNotlar: ${orderData.notes}` : ''}
    `;

    const emailPayload = {
      to: "info@kagit.online",
      from: "noreply@kagit.online",
      subject: `Yeni Sipariş - ${orderData.customerCompany}`,
      html: emailHtml,
      text: emailText,
    };

    console.log("Order email data prepared:", emailPayload);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order notification sent successfully",
        data: emailPayload 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending order email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
