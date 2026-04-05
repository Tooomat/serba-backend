// Template helper
export const emailTemplate = {
    verification: (user: string, link: string): string => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="padding: 24px;">    
                <h2>Verifikasi Akunmu!</h2>
                    <p>Hi, <strong>${user}</strong>!</p>
                    <p>
                        Terima kasih telah mendaftar di <strong>Serba</strong>! Untuk menyelesaikan 
                        proses pendaftaran, mohon verifikasi akun kamu dengan mengklik tautan di bawah ini:
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${link}" 
                        style="background:#177612;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
                            Verifikasi Akun
                        </a>
                    </div>
                    <p>
                        Setelah akun kamu terverifikasi, kamu akan memiliki akses penuh ke semua fitur kami.
                    </p>
                    <br/>
                    <p>Terima kasih,</p>
                    <p><strong>Tim Serba</strong></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
                    <p style="font-size: 12px; color: #888;">
                        Demi keamanan, tautan ini hanya dapat diakses dalam <strong>30 menit</strong>. 
                        Mohon untuk tidak membagikan tautan ini kepada pihak yang tidak berkepentingan.
                    </p>
                </div>
            ${emailFooter}
        </div>
    `,
    jobRejected: (workerName: string, jobTitle: string, companyName: string): string => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="padding: 24px;">    
                <h2>Pembaruan Lamaran</h2>
                <p>Kepada ${workerName},</p>
                <p>
                    Terima kasih atas ketertarikan Anda dan waktu yang telah Anda luangkan 
                    untuk melamar posisi <strong>${jobTitle}</strong>.
                </p>
                <p>
                    Setelah pertimbangan yang matang, <strong>${companyName}</strong> menyampaikan 
                    bahwa lamaran anda tidak melanjutkan prosesnya. Kami sangat menghargai usaha yang telah Anda curahkan.
                </p>
                <p>
                    Kami mendorong Anda untuk terus memantau lowongan pekerjaan kami 
                    untuk kesempatan di masa mendatang yang mungkin lebih sesuai dengan 
                    profil Anda.
                </p>
                <p>Semoga sukses selalu dalam perjalanan karier Anda.</p>
                <br/>
                <p>Salam hormat,</p>
                <p><strong>${companyName}</strong></p>
            </div>
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
            <div style="padding: 24px;">    
                <h2>Selamat!</h2>
                <p>Kepada ${workerName},</p>
                <p>
                    Kami dengan bangga menyampaikan bahwa lamaran Anda untuk posisi 
                    <strong>${jobTitle}</strong> telah diterima!
                </p>

                <p>
                    Kami sangat antusias untuk bekerja sama dengan Anda. 
                    Harap tunggu informasi lebih lanjut mengenai langkah berikutnya.
                </p>
                <div style="background:#f5f5f5; padding: 16px; border-radius: 8px; margin-top: 16px;">
                    <p style="margin:0"><strong>Informasi Kontak:</strong></p>
                    <p style="margin:4px 0">Email: <a href="mailto:${providerEmail}">${providerEmail}</a></p>
                    <p style="margin:4px 0">No. Telepon: ${providerPhone}</p>
                </div>
                <br/>
                <p>Salam hormat,</p>
                <p><strong>${companyName}</strong></p>
            </div>
            ${emailFooter}
        </div>
    `
}

const emailFooter = `
    <div style="background:#1a1a1a;padding:24px;margin-top:32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <p style="color:#fff;font-weight:bold;font-size:16px;margin:0 0 4px 0;">SERBA</p>
                    <p style="color:#fff;font-size:11px;margin:0 0 12px 0;letter-spacing:1px;">Work anything, anywhere, and anytime</p>
                    <p style="color:#aaa;font-size:12px;margin:0;line-height:1.6;">
                        Serba<br/>
                        Address: Jl. Contoh No.1, RT.1/RW.1,<br/>
                        Sidoarjo, Kec. Sidoarjo, Kota Sidoarjo,<br/>
                        Jawa Timur 61200
                    </p>
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
    </div>
`