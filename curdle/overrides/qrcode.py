import qrcode
import base64
from io import BytesIO

def get_qr_code(input_str):
    qr = qrcode.make(input_str)
    buffered = BytesIO()
    qr.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    b64 = base64.b64encode(img_bytes).decode('ascii')
    return f"data:image/png;base64,{b64}"