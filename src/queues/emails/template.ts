import { config } from "../../config/env"

// const imgLogo = "/public/assets/images/logo/serba-logo.png"
// const baseUrl = config.APP_URL.replace(/\/+$/, '')
// const pathImage = `${baseUrl}${imgLogo.startsWith('/') ? '' : '/'}${imgLogo}`
const pathImage = "https://res.cloudinary.com/dvlsikkf9/image/upload/v1776583476/serba-logo_ki7e8r.png"

export const emailTemplate = {
    verification: (user: string, link: string): string => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">

            <!-- HEADER -->
            <div style="background:#0f5132;padding:24px 32px;text-align:center;border-radius:10px 10px 0 0;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <img src=${pathImage} 
                        width="70" height="70" alt="serba">
                    <p style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;margin:0;">
                        SERBA
                    </p>
                </div>
            </div>

            <!-- CONTENT -->
            <div style="background:#ffffff;padding:0;border-radius:0 0 10px 10px;overflow:hidden;"> 

                <!-- MESSAGE BANNER -->
                <div style="background:#0f5132;padding:32px 24px;text-align:center;">

                    <!-- ICON (center aman) -->
                    <div style="width:64px;height:64px;background:rgba(255, 255, 255, 0.15);border-radius:50%;margin:0 auto 16px;">
                        <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle">
                                    <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" 
                                        width="28" height="28" 
                                        style="display:block;filter: brightness(0) invert(1);" 
                                        alt="email">
                                </td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size:22px;font-weight:800;color:#fff;margin:0;">
                        Verifikasi Akunmu
                    </p>

                    <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:6px 0 0;">
                        Satu langkah lagi untuk mulai menggunakan Serba
                    </p>
                </div>

                <!-- BODY -->
                <div style="padding:28px 24px;background:#31713415;">
                    <p style="font-size:15px;color:#555;margin:0 0 6px 0;">Halo, <strong style="color:#111;">${user}</strong>!</p>
                    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 28px 0;">
                        Terima kasih telah mendaftar di <strong style="color:#111;">Serba</strong>! Untuk menyelesaikan 
                        proses pendaftaran, mohon verifikasi akun kamu dengan mengklik tombol di bawah ini.
                    </p>

                    <div style="text-align:center;margin:32px 0;">
                        <a href="${link}" style="display:inline-block;background:#0f5132;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                            Verifikasi Akun
                        </a>
                    </div>

                    <p style="font-size:14px;color:#777;line-height:1.7;margin:0 0 28px 0;">
                        Setelah akun kamu terverifikasi, kamu akan mendapatkan akses penuh ke semua fitur kami.
                    </p>

                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;">
                        <p style="font-size:13px;color:#92400e;line-height:1.6;margin:0;">
                            &#9432; Tautan ini hanya berlaku selama <strong>1 jam</strong>. Jangan bagikan tautan ini kepada siapapun.
                        </p>
                    </div>

                    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;">
                        <p style="font-size:14px;color:#777;margin:0 0 4px 0;">Salam hangat,</p>
                        <p style="font-size:15px;font-weight:600;color:#111;margin:0;">Tim Serba</p>
                    </div>
                </div>

            </div>

            <!-- FOOTER -->
            ${emailFooter}

        </div>
    </div>
    `,

    jobRejected: (workerName: string, jobTitle: string, companyName: string): string => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
 
            <!-- HEADER -->
            <div style="background:#1a1a2e;padding:24px 32px;text-align:center;border-radius:10px 10px 0 0;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <img src=${pathImage}
                        width="70" height="70" alt="serba">

                    <p style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;margin:0;">
                        SERBA
                    </p>
                </div>
            </div>

            <div style="background:#ffffff;padding:0;border-radius:0 0 10px 10px;overflow:hidden;">

                <!-- FAILED BANNER -->
                <div style="background:#1a1a2e;padding:32px 24px;text-align:center;">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;">
                        <table width="64" height="64" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" valign="middle">
                                    <!-- Ganti jadi X biar sesuai "gagal" -->
                                    <span style="color:#fff;font-size:28px;font-weight:bold;">✕</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size:24px;font-weight:800;color:#fff;margin:0;">
                        Mohon Maaf!
                    </p>
                    <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:4px 0 0;">
                        Lamaran Anda belum diterima
                    </p>
                </div>

                <!-- BODY -->
                <div style="padding:28px 24px;background:#9cf29f15;">
                    <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 10px 0;">Pembaruan Lamaran</h2>
                    <p style="font-size:15px;color:#555;margin:0 0 6px 0;">Kepada <strong style="color:#111;">${workerName}</strong>,</p>
                    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 16px 0;">
                        Terima kasih atas ketertarikan Anda dan waktu yang telah Anda luangkan untuk melamar posisi 
                        <strong style="color:#111;">${jobTitle}</strong> di <strong style="color:#111;">${companyName}</strong>.
                    </p>
                    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 28px 0;">
                        Setelah melalui pertimbangan yang matang, kami dengan berat hati menyampaikan bahwa 
                        lamaran Anda tidak dapat kami lanjutkan pada tahap ini. Kami sangat menghargai waktu dan 
                        usaha yang telah Anda curahkan dalam proses seleksi ini.
                    </p>

                    <div style="background:#f8fafc;border-left:3px solid #0f5132;padding:16px 20px;margin-bottom:28px;">
                        <p style="font-size:14px;color:#444;line-height:1.7;margin:0;">
                            Kami mendorong Anda untuk terus memantau lowongan pekerjaan di Serba untuk 
                            kesempatan lain yang mungkin lebih sesuai dengan profil Anda.
                        </p>
                    </div>

                    <p style="font-size:15px;color:#555;margin:0 0 28px 0;">Semoga sukses selalu dalam perjalanan karier Anda.</p>

                    <div style="padding-top:24px;border-top:1px solid #f0f0f0;">
                        <p style="font-size:14px;color:#777;margin:0 0 4px 0;">Salam hormat,</p>
                        <p style="font-size:15px;font-weight:600;color:#111;margin:0;">${companyName}</p>
                        <p style="font-size:13px;color:#999;margin:4px 0 0 0;">melalui Platform Serba</p>
                    </div>

                </div>

            </div>

            <!-- FOOTER -->
            ${emailFooter}
        </div>
    `,
    
    jobAccepted: (
        workerName: string, 
        jobTitle: string, 
        companyName: string, 
        providerEmail: string,
        providerPhone: string
    ): string => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">

            <!-- HEADER -->
            <div style="background:#0f5132;padding:24px 32px;text-align:center;border-radius:10px 10px 0 0;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <img src=${pathImage}
                        width="70" height="70" alt="serba">

                    <p style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;margin:0;">
                        SERBA
                    </p>
                </div>
            </div>

            <!-- CONTENT -->
            <div style="background:#ffffff;padding:0;border-radius:0 0 10px 10px;overflow:hidden;">

                <!-- SUCCESS BANNER -->
                <div style="background:#0f5132;padding:32px 24px;text-align:center;">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;text-align:center;">
                        
                        <svg width="32" height="32" viewBox="0 0 24 24" 
                            style="margin-top:16px;display:inline-block;"
                            fill="none" stroke="#fff" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>

                    </div>
                    <p style="font-size:24px;font-weight:800;color:#fff;margin:0;">Selamat!</p>
                    <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:4px 0 0;">
                        Lamaran Anda telah diterima
                    </p>
                </div>
                
                <!-- BODY -->
                <div style="padding:28px 24px;background:#31713415;">
                    <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 10px 0;">Selamat!</h2>
                    <p style="font-size:15px;color:#555;margin:0 0 6px 0;">Kepada <strong style="color:#111;">${workerName}</strong>,</p>
                    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">
                        Kami dengan bangga menyampaikan bahwa lamaran Anda untuk posisi 
                        <strong style="color:#111;">${jobTitle}</strong> di <strong style="color:#111;">${companyName}</strong> 
                        telah <strong style="color:#0f5132;">berhasil diterima!</strong>
                    </p>

                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 22px;margin-bottom:24px;">
                        <p style="font-size:12px;font-weight:700;color:#166534;letter-spacing:0.8px;text-transform:uppercase;margin:0 0 14px 0;">Informasi Kontak</p>
                        <p style="font-size:14px;color:#444;margin:0 0 8px 0;">
                            &#9993; <a href="mailto:${providerEmail}" style="color:#0f5132;text-decoration:none;">${providerEmail}</a>
                        </p>
                        <p style="font-size:14px;color:#444;margin:0;">
                            &#128222; ${providerPhone}
                        </p>
                    </div>

                    <p style="font-size:14px;color:#777;line-height:1.7;margin:0 0 28px 0;">
                        Tim kami akan segera menghubungi Anda dengan informasi lebih lanjut. 
                        Kami sangat antusias untuk bekerja sama dengan Anda!
                    </p>

                    <div style="padding-top:24px;border-top:1px solid #f0f0f0;">
                        <p style="font-size:14px;color:#777;margin:0 0 4px 0;">Salam hangat,</p>
                        <p style="font-size:15px;font-weight:600;color:#111;margin:0;">${companyName}</p>
                        <p style="font-size:13px;color:#999;margin:4px 0 0 0;">melalui Platform Serba</p>
                    </div>
                </div>
                
            </div>

            <!-- FOOTER -->
            ${emailFooter}
        </div>
    `
}

const emailFooter = `
    <div style="background:#0a3d22;padding:20px;border-radius:10px;margin-top:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="vertical-align:middle;padding-right:10px;">
                                <img src=${pathImage} width="36" height="36" alt="serba">
                            </td>
                            <td style="vertical-align:middle;">
                                <p style="color:#fff;font-weight:800;font-size:14px;letter-spacing:1px;margin:0 0 2px 0;">SERBA</p>
                                <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Work anything, anywhere, anytime</p>
                            </td>
                        </tr>
                    </table>
                </td>

                <td style="vertical-align:bottom;text-align:right;">
                    <a href=" " style="display:inline-block;margin-left:8px;">
                        <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" width="24" height="24" alt="Instagram"/>
                    </a>
                    <a href=" " style="display:inline-block;margin-left:8px;">
                        <img src="https://cdn-icons-png.flaticon.com/24/145/145807.png" width="24" height="24" alt="LinkedIn"/>
                    </a>
                </td>
            </tr>
        </table>

        <p style="color:rgba(255,255,255,0.4);font-size:11px;line-height:1.7;border-top:1px solid rgba(255,255,255,0.08);padding-top:14px;">
            Jl. Contoh No.1, RT.1/RW.1, Sidoarjo, Kec. Sidoarjo, Kota Sidoarjo, Jawa Timur 61200<br>
            &copy; 2025 Serba. All rights reserved. &nbsp;·&nbsp;
            <a href="https://serba.id/privacy" style="color:rgba(255,255,255,0.5);text-decoration:none;">Kebijakan Privasi</a> &nbsp;·&nbsp;
            <a href="https://serba.id/unsubscribe" style="color:rgba(255,255,255,0.5);text-decoration:none;">Berhenti Berlangganan</a>
        </p>
    </div>
`
