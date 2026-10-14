import io
import time
from typing import Dict, Any, Optional
from PIL import Image, ImageOps, ImageFilter

class ImageEngine:
    """
    Manages generation metadata, inpainting/editing operations,
    and lineage tracking for generated and modified images.
    """

    @staticmethod
    def create_placeholder_image(prompt: str, width: int = 512, height: int = 512, color: str = "#4f46e5") -> bytes:
        """Creates a verified PNG image for offline testing or mock image generation."""
        img = Image.new("RGB", (width, height), color=color)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    @staticmethod
    def edit_image(source_bytes: bytes, instruction: str) -> bytes:
        """
        Applies verified image transformation (e.g. grayscale, blur, edge enhancement)
        simulating model-guided editing while guaranteeing output format integrity.
        """
        img = Image.open(io.BytesIO(source_bytes)).convert("RGB")
        
        lower_inst = instruction.lower()
        if "gråtone" in lower_inst or "grayscale" in lower_inst or "black and white" in lower_inst:
            res = ImageOps.grayscale(img).convert("RGB")
        elif "uskarp" in lower_inst or "blur" in lower_inst:
            res = img.filter(ImageFilter.GaussianBlur(radius=3))
        elif "kontur" in lower_inst or "edge" in lower_inst:
            res = img.filter(ImageFilter.FIND_EDGES)
        else:
            # Subtle contrast adjustment as fallback edit
            res = ImageOps.autocontrast(img)

        buf = io.BytesIO()
        res.save(buf, format="PNG")
        return buf.getvalue()

    @staticmethod
    def inspect_image(source_bytes: bytes) -> Dict[str, Any]:
        """Validates format, size, and dimensions of image bytes."""
        img = Image.open(io.BytesIO(source_bytes))
        return {
            "format": img.format,
            "width": img.width,
            "height": img.height,
            "mode": img.mode
        }
