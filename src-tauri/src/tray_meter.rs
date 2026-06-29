use tauri::image::Image;

const SIZE: u32 = 32;

/// Renders a 32×32 RGBA bar-meter icon for non-macOS platforms.
/// The bar fills from the bottom proportionally to `pct` (0–100).
/// Color: blue (<80) → orange (80–94) → red (95–99) → purple (100).
pub fn render(pct: f32) -> Image<'static> {
    let mut px = vec![0u8; (SIZE * SIZE * 4) as usize];

    // Dark semi-transparent background
    fill_rect(&mut px, 0, 0, SIZE, SIZE, (20, 20, 20, 220));

    // 1-px light border
    let dim = SIZE;
    for x in 0..dim {
        set_pixel(&mut px, x, 0, (180, 180, 180, 255));
        set_pixel(&mut px, x, dim - 1, (180, 180, 180, 255));
    }
    for y in 0..dim {
        set_pixel(&mut px, 0, y, (180, 180, 180, 255));
        set_pixel(&mut px, dim - 1, y, (180, 180, 180, 255));
    }

    // Inner meter area: 2–29 (28 px wide, 28 px tall)
    let inner_x0 = 2u32;
    let inner_y0 = 2u32;
    let inner_w = SIZE - 4;
    let inner_h = SIZE - 4;

    let filled = ((pct.clamp(0.0, 100.0) / 100.0) * inner_h as f32).round() as u32;
    let color = meter_color(pct);

    if filled > 0 {
        let y_start = inner_y0 + (inner_h - filled);
        fill_rect(&mut px, inner_x0, y_start, inner_w, filled, color);
    }

    Image::new_owned(px, SIZE, SIZE)
}

fn meter_color(pct: f32) -> (u8, u8, u8, u8) {
    let (r, g, b) = if pct >= 100.0 {
        (148, 0, 211)   // Purple
    } else if pct >= 95.0 {
        (220, 38, 38)   // Red
    } else if pct >= 80.0 {
        (249, 115, 22)  // Orange
    } else {
        (59, 130, 246)  // Blue
    };
    (r, g, b, 255)
}

fn fill_rect(px: &mut [u8], x0: u32, y0: u32, w: u32, h: u32, (r, g, b, a): (u8, u8, u8, u8)) {
    for y in y0..y0 + h {
        for x in x0..x0 + w {
            set_pixel(px, x, y, (r, g, b, a));
        }
    }
}

fn set_pixel(px: &mut [u8], x: u32, y: u32, (r, g, b, a): (u8, u8, u8, u8)) {
    let i = ((y * SIZE + x) * 4) as usize;
    if i + 3 < px.len() {
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = a;
    }
}
