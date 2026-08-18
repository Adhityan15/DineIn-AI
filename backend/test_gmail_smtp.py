import smtplib
from email.mime.text import MIMEText

def test_smtp():
    sender = 'dineinplatform@gmail.com'
    receiver = 'dineinplatform@gmail.com'
    password = 'awhviujeqnajeckx'
    
    msg = MIMEText('Test email content from DineIn SMTP tester.')
    msg['Subject'] = 'DineIn SMTP Test'
    msg['From'] = sender
    msg['To'] = receiver
    
    try:
        print("Connecting to smtp.gmail.com:587...")
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
        print("Starting TLS...")
        server.starttls()
        print("Logging in...")
        server.login(sender, password)
        print("Sending email...")
        server.sendmail(sender, [receiver], msg.as_string())
        server.quit()
        print("SMTP TEST SUCCESSFUL!")
    except Exception as e:
        print(f"SMTP TEST FAILED: {e}")

if __name__ == '__main__':
    test_smtp()
