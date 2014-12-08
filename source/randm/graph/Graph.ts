/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
/// <reference path='IPutPixelFunction.ts' />

// doors menu club on card
// user setup position of characters on buttons
// flisthdr size of "Area" text
// listmsgs size of text
// news size of text
// pageuser size of text
// search2 and searches fill on magnifying glass
// uaccount clock
// userlist keyboard
// welcome size of text
class Graph {
    private static ASPECT_RATIO: number = 0.775; // 7750 over 10000
    public static PIXELS_X: number = 640;
    public static PIXELS_Y: number = 350;
    public static PIXELS: number = Graph.PIXELS_X * Graph.PIXELS_Y;

    // The full EGA palette
    private static EGA_PALETTE: number[] = [
        0xFF000000, 0xFF0000AA, 0xFF00AA00, 0xFF00AAAA, 0xFFAA0000, 0xFFAA00AA, 0xFFAAAA00, 0xFFAAAAAA,
        0xFF000055, 0xFF0000FF, 0xFF00AA55, 0xFF00AAFF, 0xFFAA0055, 0xFFAA00FF, 0xFFAAAA55, 0xFFAAAAFF,
        0xFF005500, 0xFF0055AA, 0xFF00FF00, 0xFF00FFAA, 0xFFAA5500, 0xFFAA55AA, 0xFFAAFF00, 0xFFAAFFAA,
        0xFF005555, 0xFF0055FF, 0xFF55FF00, 0xFF00FFFF, 0xFFAA5555, 0xFFAA55FF, 0xFFAAFF55, 0xFFAAFFFF,
        0xFF550000, 0xFF5500AA, 0xFF55AA00, 0xFF55AAAA, 0xFFFF0000, 0xFFFF00AA, 0xFFFFAA00, 0xFFFFAAAA,
        0xFF550055, 0xFF5500FF, 0xFF55AA55, 0xFF55AAFF, 0xFFFF0055, 0xFFFF00FF, 0xFFFFAA55, 0xFFFFAAFF,
        0xFF555500, 0xFF5555AA, 0xFF55FF00, 0xFF55FFAA, 0xFFFF5500, 0xFFFF55AA, 0xFFFFFF00, 0xFFFFFFAA,
        0xFF555555, 0xFF5555FF, 0xFF55FF55, 0xFF55FFFF, 0xFFFF5555, 0xFFFF55FF, 0xFFFFFF55, 0xFFFFFFFF
    ];

    // The current palette, which can only contain 16 elements from the full EGA palette at one time
    public static CURRENT_PALETTE: number[] = [
        Graph.EGA_PALETTE[0], Graph.EGA_PALETTE[1], Graph.EGA_PALETTE[2], Graph.EGA_PALETTE[3],
        Graph.EGA_PALETTE[4], Graph.EGA_PALETTE[5], Graph.EGA_PALETTE[20], Graph.EGA_PALETTE[7],
        Graph.EGA_PALETTE[56], Graph.EGA_PALETTE[57], Graph.EGA_PALETTE[58], Graph.EGA_PALETTE[59],
        Graph.EGA_PALETTE[60], Graph.EGA_PALETTE[61], Graph.EGA_PALETTE[62], Graph.EGA_PALETTE[63]
    ];

    private static _FillSettings: FillSettings = new FillSettings();
    private static _LineSettings: LineSettings = new LineSettings();
    private static _TextSettings: TextSettings = new TextSettings();
    private static _ViewPortSettings: ViewPortSettings = new ViewPortSettings();

    private static _Bitmap: any; // TODO Bitmap;
    private static _Canvas: any; // TODO Sprite;

    private static _BackColour: number = 0;
    private static _Colour: number = 0;
    private static _CursorPosition: Point = new Point(0, 0);
    private static _Dirty: number = DirtyType.Clear;
    private static _FillEllipse: Boolean = false;
    private static _FillPolyMap: any = [];
    private static _Pixels: number[];
    private static _TextWindow: Rectangle = new Rectangle(0, 0, Crt.ScreenCols, Crt.ScreenRows);
    private static _WriteMode: number = WriteMode.Normal;

    public static PutPixel: IPutPixelFunction = Graph.PutPixelDefault;

    // Static constructor
    private static __ctor = ((): void => {
        //TODO Graph._Canvas = new Sprite();

        // Create the bitmap
        //TODO Graph._Bitmap = new Bitmap(new BitmapData(this.PIXELS_X, PIXELS_Y, false, 0), PixelSnapping.NEVER, false);
        Graph._Canvas.addChild(Graph._Bitmap);
        Graph._Canvas.width = Graph._Bitmap.width;
        Graph._Canvas.height = Graph._Bitmap.height;

        // Add the Crt window in the hidden state
        Graph._Canvas.addChild(Crt.Canvas);

        // And more variables
        //TODO this._Pixels = this._Bitmap.bitmapData.getVector(new flash.geom.Rectangle(0, 0, this.PIXELS_X, PIXELS_Y));

        // Add the exit frame listener that will repaint when necessary
        //TODO FCanvas.addEventListener(Event.EXIT_FRAME, OnExitFrame);

        // Set defaults
        Graph.GraphDefaults();
    });

    // Draws a circular arc.
    // The arc goes from StAngle (start angle) to EndAngle, with radius Radius,
    // using (x,y) as the center point.
    public static Arc(AX: number, AY: number, AStartAngle: number, AEndAngle: number, ARadius: number): void {
        this.Ellipse(AX, AY, AStartAngle, AEndAngle, ARadius, Math.floor(ARadius * this.ASPECT_RATIO));
    }

    // Draws a bar using the current fill style and fill color.
    // Bar draws a filled-in rectangle (used in bar charts, for example). Uses the
    // pattern and color defined by SetFillStyle or SetFillPattern. To draw an
    // outlined bar, call Bar3D with a depth of zero.
    public static Bar(AX1: number, AY1: number, AX2: number, AY2: number): void {
        var x: number;
        var y: number;

        // Adjust for modified viewport, if necessary
        if ((this._ViewPortSettings.Clip) && (!this._ViewPortSettings.FullScreen)) {
            // Convert to global coordinates
            AX1 += this._ViewPortSettings.x1;
            AY1 += this._ViewPortSettings.y1;
            AX2 += this._ViewPortSettings.x1;
            AY2 += this._ViewPortSettings.y1;

            // Ensure that x1 and y1 are in the visible viewport
            if ((AX1 > this._ViewPortSettings.x2) || (AY1 > this._ViewPortSettings.y2)) return;
        }

        // Make sure x2 and y2 don't exceed the visible viewport
        AX2 = Math.min(AX2, this._ViewPortSettings.x2);
        AY2 = Math.min(AY2, this._ViewPortSettings.y2);

        // Indicate that we need to repaint
        this._Dirty = DirtyType.Pixel;

        var XOffset: number = AX1 + (AY1 * this.PIXELS_X);
        var RowSkip: number = ((this.PIXELS_X - 1) - AX2) + (AX1)

			// OPTIMIZATION: In certain circumstances we can ignore the pattern lookup
			if ((this._FillSettings.Colour == this._BackColour) || (this._FillSettings.Style == FillStyle.Empty) || (this._FillSettings.Style == FillStyle.Solid)) {
            // No pattern lookup needed because either:
            //  - The fill colour is the same as the background colour
            //  - The fill style is to use the background colour
            //  - The fill style is solid (always use fill colour)

            // Check which colour to use
            var Colour: number = (this._FillSettings.Style == FillStyle.Solid) ? this._FillSettings.Colour : this._BackColour;
            Colour = this.CURRENT_PALETTE[Colour];

            // Fill all the pixels with the specified colour
            for (y = AY1; y <= AY2; y++) {
                for (x = AX1; x <= AX2; x++) {
                    this._Pixels[XOffset++] = Colour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(XOffset++, Colour); // Incrememnt offset in pixel lookup
                }
                XOffset += RowSkip;
            }
        } else {
            // Need to do a pattern lookup since the condition for a patternless fill wasn't met
            for (y = AY1; y <= AY2; y++) {
                for (x = AX1; x <= AX2; x++) {
                    this._Pixels[XOffset] = this.CURRENT_PALETTE[this._FillSettings.Colour & this._FillSettings.Pattern[XOffset++]]; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(XOffset, this.CURRENT_PALETTE[this._FillSettings.Colour & this._FillSettings.Pattern[XOffset++]]); // Incrememnt offset in pattern lookup
                }
                XOffset += RowSkip;
            }
        }
    }

    // Draw a bezier curve (NB: cubic, not quadratic)
    // Adapted from http://www.paultondeur.com/2008/03/09/drawing-a-cubic-bezier-curve-using-actionscript-3/
    public static Bezier(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, count: number): void {
        var lastx: number = x1;
        var lasty: number = y1;
        var nextx: number;
        var nexty: number;

        var ucubed: number;
        var usquared: number;
        for (var u: number = 0; u <= 1; u += 1 / count) {
            usquared = u * u;
            ucubed = usquared * u;

            nextx = ucubed * (x4 + 3 * (x2 - x3) - x1) + 3 * usquared * (x1 - 2 * x2 + x3) + 3 * u * (x2 - x1) + x1;
            nexty = ucubed * (y4 + 3 * (y2 - y3) - y1) + 3 * usquared * (y1 - 2 * y2 + y3) + 3 * u * (y2 - y1) + y1;
            this.Line(lastx, lasty, nextx, nexty);

            lastx = nextx;
            lasty = nexty;
        }

        // Let the curve end on the second anchorPoint
        this.Line(lastx, lasty, x4, y4);
    }

    // TODO
    //public get bitmapData(): BitmapData {
    //    return this._Bitmap.bitmapData;
    //}

    //public static get Canvas(): Sprite {
    //    return FCanvas;
    //}

    // Clears the text window with the current background colour and homes the cursor
    public static ClearTextWindow(): void {
        var x1: number = Crt.Canvas.x;
        var x2: number = Crt.Canvas.x + Crt.Canvas.width - 1;
        var y1: number = Crt.Canvas.y;
        var y2: number = Crt.Canvas.y + Crt.Canvas.height - 1;

        var Colour: number = this.CURRENT_PALETTE[this._BackColour];
        var XOffset: number = x1 + (y1 * this.PIXELS_X);
        var RowSkip: number = ((this.PIXELS_X - 1) - x2) + (x1);

        // Indicate that we need to repaint
        this._Dirty = DirtyType.Pixel;

        // Reset the pixels behind the text window
        for (var y: number = y1; y <= y2; y++) {
            for (var x: number = x1; x <= x2; x++) {
                this._Pixels[XOffset++] = Colour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(XOffset++, Colour);
            }
            XOffset += RowSkip;
        }

        // Clear the Crt screen
        Crt.ClrScr();
    }

    // Clears the current view port (graphics mode only).
    // ClearViewPort sets the fill color to the background color and
    // moves the current pointer to (0, 0).
    public static ClearViewPort(): void {
        // Home the cursor
        this.MoveTo(0, 0);

        // Save our old fill style and override it
        var OldFillStyle: number = this._FillSettings.Style;
        this._FillSettings.Style = FillStyle.Empty;

        // Draw a bar, which will automatically be clipped to the viewport if necessary
        this.Bar(0, 0, (this.PIXELS_X - 1), (this.PIXELS_Y - 1));

        // Restore the old fill style
        this._FillSettings.Style = OldFillStyle;

        // Indicate that we need to repaint
        if ((this._ViewPortSettings.Clip) && (!this._ViewPortSettings.FullScreen)) {
            // Only partial screen cleared
            this._Dirty = DirtyType.Pixel;
        } else {
            // Full scren was cleared
            this._Dirty = DirtyType.Clear;
        }
    }

    // Draws a circle (in the current color set by SetColor), using (X,Y) as the
    // center point.
    // Draws a circle in the current color set by SetColor. Each graphics driver
    // contains an aspect ratio used by Circle, Arc, and PieSlice.
    public static Circle(AX: number, AY: number, ARadius: number): void {
        this.Ellipse(AX, AY, 0, 360, ARadius, Math.floor(ARadius * this.ASPECT_RATIO));
    }

    // Draws the outline of a polygon using the current line style and color.
    // NumPoints specifies the number of coordinates in PolyPoints. A coordinate
    // consists of two words, an X and a Y value.
    public static DrawPoly(APoints: Point[]): void {
        var APointslength: number = APoints.length;
        for (var i: number = 1; i < APointslength; i++) {
            this.Line(APoints[i - 1].x, APoints[i - 1].y, APoints[i].x, APoints[i].y);
        }
    }

    // Draws an elliptical arc.
    // Draws the arc from StAngle (start angle) to EndAngle, with radii XRadius and
    // YRadius, sing (X,Y) as the center point.
    public static Ellipse(AX: number, AY: number, AStartAngle: number, AEndAngle: number, AXRadius: number, AYRadius: number): void {
        // Abort if start angle and end angle match (if a person wants a full circle, they should use 0-360)
        if (AStartAngle == AEndAngle) return;

        var ConvFac: number = Math.PI / 180.0;
        var j: number;
        var Delta: number;
        var DeltaEnd: number;
        var NumOfPixels: number;
        var TempTerm: number;
        var xtemp: number;
        var ytemp: number;
        var xp: number;
        var yp: number;
        var xm: number;
        var ym: number;
        var xnext: number;
        var ynext: number;
        var BackupColor: number;
        var TmpAngle: number;
        var OldLineWidth: number;

        // check if valid angles
        AStartAngle = AStartAngle % 361;
        AEndAngle = AEndAngle % 361;

        // if impossible angles then run as two separate calls
        if (AEndAngle < AStartAngle) {
            this.Ellipse(AX, AY, AStartAngle, 360, AXRadius, AYRadius);
            this.Ellipse(AX, AY, 0, AEndAngle, AXRadius, AYRadius);
            return;
        }

        if (this._LineSettings.Thickness == LineThickness.Thick) {
            // first draw the two outer ellipses using normwidth and no filling (JM)
            OldLineWidth = this._LineSettings.Thickness;
            this._LineSettings.Thickness = LineThickness.Normal;

            this.Ellipse(AX, AY, AStartAngle, AEndAngle, AXRadius + 1, AYRadius + 1);
            this.Ellipse(AX, AY, AStartAngle, AEndAngle, AXRadius, AYRadius);

            // restore line thickness
            this._LineSettings.Thickness = OldLineWidth;

            if ((AXRadius > 0) && (AYRadius > 0)) {
                // draw the smallest ellipse last, since that one will use the 
                // original pl, so it could possibly draw patternlines (JM)    
                AXRadius--;
                AYRadius--;
            } else {
                return;
            }
        }

        if (AXRadius == 0) AXRadius++;
        if (AYRadius == 0) AYRadius++;

        // check for an ellipse with negligable x and y radius
        if ((AXRadius <= 1) && (AYRadius <= 1)) {
            this.PutPixel(AX, AY, this._Colour);
            return;
        }

        // approximate the number of pixels required by using the circumference 
        // equation of an ellipse.                                              
        // Changed this formula a it (trial and error), but the net result is that 
        // less pixels have to be calculated now                                   
        NumOfPixels = Math.round(Math.sqrt(3) * Math.sqrt(Math.pow(AXRadius, 2) + Math.pow(AYRadius, 2)));

        // Calculate the angle precision required 
        Delta = 90.0 / NumOfPixels;

        // Always just go over the first 90 degrees. Could be optimized a   
        // bit if StAngle and EndAngle lie in the same quadrant, left as an 
        // exercise for the reader :) (JM)                                  
        j = 0;

        // calculate stop position, go 1 further than 90 because otherwise 
        // 1 pixel is sometimes not drawn (JM)                             
        DeltaEnd = 91;

        // Calculate points 
        xnext = AXRadius;
        ynext = 0;

        do {
            xtemp = xnext;
            ytemp = ynext;

            // this is used by both sin and cos
            TempTerm = (j + Delta) * ConvFac;

            // Calculate points 
            xnext = Math.round(AXRadius * Math.cos(TempTerm));
            ynext = Math.round(AYRadius * Math.sin(TempTerm + Math.PI));

            xp = AX + xtemp;
            xm = AX - xtemp;
            yp = AY + ytemp;
            ym = AY - ytemp;

            if ((j >= AStartAngle) && (j <= AEndAngle)) {
                this.PutPixel(xp, yp, this._Colour);
            }
            if (((180 - j) >= AStartAngle) && ((180 - j) <= AEndAngle)) {
                this.PutPixel(xm, yp, this._Colour);
            }
            if (((j + 180) >= AStartAngle) && ((j + 180) <= AEndAngle)) {
                this.PutPixel(xm, ym, this._Colour);
            }
            if (((360 - j) >= AStartAngle) && ((360 - j) <= AEndAngle)) {
                this.PutPixel(xp, ym, this._Colour);
            }

            // Now draw the vertical lines using Bar() so we get the right fill
            if (this._FillEllipse) {
                this.Bar(Math.max(0, xm + 1), Math.max(0, yp + 1), Math.min(this.PIXELS_X - 1, xm + 1), Math.min(this.PIXELS_Y - 1, ym - 1));
                this.Bar(Math.max(0, xp - 1), Math.max(0, yp + 1), Math.min(this.PIXELS_X - 1, xp - 1), Math.min(this.PIXELS_Y - 1, ym - 1));
            }

            j = j + Delta;
        } while (j <= DeltaEnd);
    }

    // Clears the text line with the current background colour
    public static EraseEOL(): void {
        //TODO Not tested yet
        var x1: number = Crt.Canvas.x + ((Crt.WhereX() - 1) * Crt.Font.Width);
        var x2: number = Crt.Canvas.x + Crt.Canvas.width - 1;
        var y1: number = Crt.Canvas.y + ((Crt.WhereY() - 1) * Crt.Font.Height);
        var y2: number = y1 + Crt.Font.Height;

        var Colour: number = this.CURRENT_PALETTE[this._BackColour];
        var XOffset: number = x1 + (y1 * this.PIXELS_X);
        var RowSkip: number = ((this.PIXELS_X - 1) - x2) + (x1);

        // Indicate that we need to repaint
        this._Dirty = DirtyType.Pixel;

        // Reset the pixels behind the text window
        for (var y: number = y1; y <= y2; y++) {
            for (var x: number = x1; x <= x2; x++) {
                this._Pixels[XOffset++] = Colour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(XOffset++, Colour);
            }
            XOffset += RowSkip;
        }

        // Clear the Crt line
        Crt.ClrEol();
    }

    // Draws a filled ellipse
    // (X,Y) is the center point; XRadius and YRadius are the horizontal and
    // vertical axes.
    public static FillEllipse(AX: number, AY: number, AXRadius: number, AYRadius: number): void {
        this._FillEllipse = true;
        this.Ellipse(AX, AY, 0, 360, AXRadius, AYRadius);
        this._FillEllipse = false;
    }

    // Fills a polygon, using the scan converter
    // PolyPoints is an untyped parameter that contains the coordinates of each
    // intersection in the polygon. NumPoints specifies the number of coordinates
    // in PolyPoints. A coordinate consists of two words, an X and a Y value.
    // FillPoly calculates all the horizontal intersections, and then fills the
    // polygon using the current fill style and color defined by SetFillStyle or
    // SetFillPattern. The outline of the polygon is drawn in the current line
    // style and color as set by SetLineStyle.
    public static FillPoly(APoints: Point[]): void {
        // Reset the pixel map (which records which pixels were set since the last time the map was reset)
        //TODO this._FillPolyMap.InitTwoDimensions(this.PIXELS_X, PIXELS_Y);

        // Draw the polygon (override this.PutPixel() to the version that records pixel locations first)
        this.PutPixel = this.PutPixelPoly;
        this.DrawPoly(APoints);
        this.PutPixel = this.PutPixelDefault;

        // Get the bounding rect of the polygon (so we only use PointInPoly() on pixels we need to)
        var Bounds: flash.geom.Rectangle = new Rectangle();
        Bounds.left = APoints[0].x;
        Bounds.top = APoints[0].y;
        Bounds.right = APoints[0].x;
        Bounds.bottom = APoints[0].y;

        var APointslength: number = APoints.length;
        for (var i: number = 1; i < APointslength; i++) {
            if (APoints[i].x < Bounds.left) Bounds.left = APoints[i].x;
            if (APoints[i].y < Bounds.top) Bounds.top = APoints[i].y;
            if (APoints[i].x > Bounds.right) Bounds.right = APoints[i].x;
            if (APoints[i].y > Bounds.bottom) Bounds.bottom = APoints[i].y;
        }

        // Sanity checking for bounds
        Bounds.left = Math.max(Bounds.left, 0);
        Bounds.top = Math.max(Bounds.top, 0);
        Bounds.right = Math.min(Bounds.right, 639);
        Bounds.bottom = Math.min(Bounds.bottom, 349);

        // Fill the pixels that need filling
        // NOTE: The simplest way to do this is just call PointInPoly() for every pixel in the bounding
        //       rectangle, but that's slow, so instead we only call it after crossing an edge.
        //       This modified version is more code, but takes about 17% of the time (so if the old
        //       PointInPoly() only method took 1 second, this modified from would take 170ms)
        for (var y: number = Bounds.top; y <= Bounds.bottom; y++) {
            var InPoly: Boolean = false;
            var LastWasEdge: Boolean = false;
            var LeftPoint: number = -1;
            var RightPoint: number = -1;

            for (var x: number = Bounds.left; x <= Bounds.right; x++) {
                // Check if the current pixel is an edge
                if (this._FillPolyMap[x][y] == 1) {
                    // Yep, check if the previous pixel was an edge
                    if (LastWasEdge) {
                        // Yep, ignore since it just means we hit two edge pixels in a row (could happen with horizontal lines for example, or thick lines)
                    } else {
                        // Nope, so check if we've transitioned from in the polygon to out of the polygon
                        if (LeftPoint != -1) {
                            // Yep, so do the fill
                            this.Bar(LeftPoint, y, RightPoint, y);
                            LeftPoint = -1;
                            RightPoint = -1;
                        }
                    }

                    LastWasEdge = true;
                } else {
                    // Nope, check if the previous pixel was an edge
                    if (LastWasEdge) {
                        // Yep, check to see if we're now inside or outside the polygon
                        InPoly = this.PointInPoly(x, y, APoints);
                    }

                    // Check if we're inside the polygon
                    if (InPoly) {
                        // Yep, check if we have a left point yet
                        if (LeftPoint == -1) {
                            // Nope, so record the current pixel as the left and right point
                            LeftPoint = x;
                            RightPoint = x;
                        } else {
                            // Yep, so update the right point
                            RightPoint = x;
                        }
                    }

                    LastWasEdge = false;
                }
            }
        }
    }

    // Fills a bounded region with the current fill pattern and color.
    // Fills an enclosed area on bitmap devices. (X, Y) is a seed within the
    // enclosed area to be filled. The current fill pattern, as set by SetFillStyle
    // or SetFillPattern, is used to flood the area bounded by Border color. If the
    // seed point is within an enclosed area, then the inside will be filled. If
    // the seed is outside the enclosed area, then the exterior will be filled.
    public static FloodFill(AX: number, AY: number, ABorder: number): void {
        // Adjust for modified viewport, if necessary
        if ((this._ViewPortSettings.Clip) && (!this._ViewPortSettings.FullScreen)) {
            // Convert to global coordinates
            AX += this._ViewPortSettings.x1;
            AY += this._ViewPortSettings.y1;

            // Ensure that x and y are in the visible viewport
            if ((AX < this._ViewPortSettings.x1) || (AX > this._ViewPortSettings.x2) || (AY < this._ViewPortSettings.y1) || (AY > this._ViewPortSettings.y2)) return;
        }

        // Check if target point is already border colour point is in viewport
        if (this._Pixels[AX + (AY * this.PIXELS_X)] == this.CURRENT_PALETTE[ABorder]) return;

        var VisitedPoints: number[] = [];
        var ProcessPoints: number[] = [];

        ProcessPoints.push(AX + (AY * this.PIXELS_X));

        var ThisPoint: number;
        var NorthPoint: number;
        var SouthPoint: number;
        var EastPoint: number;
        var WestPoint: number;
        var LeftEdge: number;
        var RightEdge: number;
        var LeftStop: number;
        var RightStop: number;
        var WantTop: Boolean;
        var WantBottom: Boolean;
        var DidTop: Boolean;
        var DidBottom: Boolean;
        var DoNorth: Boolean;
        var DoSouth: Boolean;
        while (ProcessPoints.length > 0) {
            ThisPoint = ProcessPoints.pop();

            LeftEdge = Math.floor(ThisPoint / this.PIXELS_X) * this.PIXELS_X;
            if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen) LeftEdge += this._ViewPortSettings.FromLeft;
            LeftStop = ThisPoint;
            while ((LeftStop >= LeftEdge) && (this._Pixels[LeftStop] != this.CURRENT_PALETTE[ABorder])) LeftStop -= 1;
            LeftStop += 1;

            RightEdge = (Math.floor(ThisPoint / this.PIXELS_X) * this.PIXELS_X) + this.PIXELS_X - 1;
            if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen) RightEdge -= this._ViewPortSettings.FromRight;
            RightStop = ThisPoint;
            while ((RightStop <= RightEdge) && (this._Pixels[RightStop] != this.CURRENT_PALETTE[ABorder])) RightStop += 1;
            RightStop -= 1;

            DidTop = false;
            DidBottom = false;
            DoNorth = ThisPoint >= this.PIXELS_X;
            if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen) DoNorth = (ThisPoint >= (this._ViewPortSettings.FromTop + 1) * this.PIXELS_X);
            DoSouth = ThisPoint <= ((this.PIXELS - 1) - this.PIXELS_X);
            if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen) DoSouth = (ThisPoint <= ((this.PIXELS - 1) - ((this._ViewPortSettings.FromBottom + 1) * this.PIXELS_X)));
            for (var i: number = LeftStop; i <= RightStop; i++) {
                this._Pixels[i] = this.CURRENT_PALETTE[this._FillSettings.Colour & this._FillSettings.Pattern[i]]; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(i, this.CURRENT_PALETTE[this._FillSettings.Colour & this._FillSettings.Pattern[i]]);
                VisitedPoints[i] = 1;

                // Check above
                if (DoNorth) {
                    NorthPoint = i - this.PIXELS_X;
                    WantTop = ((VisitedPoints[NorthPoint] == 0) && (this._Pixels[NorthPoint] != this.CURRENT_PALETTE[ABorder]));
                    if (WantTop && !DidTop) {
                        ProcessPoints.push(NorthPoint);
                        DidTop = true;
                    } else if (!WantTop && DidTop) {
                        DidTop = false;
                    }
                }

                // Check below
                if (DoSouth) {
                    SouthPoint = i + this.PIXELS_X;
                    WantBottom = ((VisitedPoints[SouthPoint] == 0) && (this._Pixels[SouthPoint] != this.CURRENT_PALETTE[ABorder]));
                    if (WantBottom && !DidBottom) {
                        ProcessPoints.push(SouthPoint);
                        DidBottom = true;
                    } else if (!WantBottom && DidBottom) {
                        DidBottom = false;
                    }
                }
            }
        }

        // Indicate that we need to repaint
        this._Dirty = DirtyType.Pixel;
    }

    // Returns the current drawing color.
    // Drawing colors range from 0 to 15, depending on the current graphics driver
    // and current graphics mode.
    public static GetColour(): number {
        return this._Colour;
    }

    // Gets the current fill pattern and color, as set by SetFillStyle or
    // SetFillPattern.
    // The Pattern field reports the current fill pattern selected. The colors
    // field reports the current fill color selected. Both the fill pattern and
    // color can be changed by calling the SetFillStyle or SetFillPattern
    // procedure.
    // 	If Pattern is equal to UserFill, use GetFillPattern to get the user-defined
    // fill pattern that is selected.
    public static GetFillSettings(): FillSettings {
        return this._FillSettings;
    }

    // Saves a bit image of the specified region into a buffer.
    // X1, Y1, X2, and Y2 define a rectangular region on the screen. BitMap is an
    // untyped parameter that must be greater than or equal to 6 plus the amount of
    // area defined by the region. The first two words of BitMap store the width
    // and height of the region. The third word is reserved.
    // The remaining part of BitMap is used to save the bit image itself. Use the
    // ImageSize function to determine the size requirements of BitMap.
    public static GetImage(x1: number, y1: number, x2: number, y2: number): BitmapData {
        // TODO Validate coordinates are top left and bottom right?

        // Need to ensure this._Pixels is written to this._Bitmap before we copy the region
        if (this._Dirty != DirtyType.None) {
            this._Dirty = DirtyType.None;
            this._Bitmap.bitmapData.setVector(new Rectangle(0, 0, this.PIXELS_X, this.PIXELS_Y), this._Pixels);
        }

        var Result: BitmapData = new BitmapData(x2 - x1 + 1, y2 - y1 + 1);
        Result.copyPixels(this._Bitmap.bitmapData, new Rectangle(x1, y1, Result.width, Result.height), new Point(0, 0));
        return Result;
    }

    // Homes the current pointer (CP) and resets the graphics system to specified
    // default values.
    // Homes the current pointer (CP) and resets the graphics system to the default
    // values for
    //   viewport
    //   palette
    //   draw and background colors
    //   line style and line pattern
    //   fill style, fill color, and fill pattern
    //   active font, text style, text justification, and user Char size
    public static GraphDefaults(): void {
        this.SetLineStyle(LineStyle.Solid, 0xFFFF, LineThickness.Normal);
        this.SetFillStyle(FillStyle.Solid, 15);

        this.SetColour(15);
        this.SetBkColour(0);

        // Update the palette, but tell it not to update the screen since it'll be cleared below anyway
        this.SetAllPalette(Vector.<int>([0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63]), false);
        this.SetViewPort(0, 0, (this.PIXELS_X - 1), (this.PIXELS_Y - 1), true);
        this.ClearViewPort();

        this.MoveTo(0, 0);
        this.SetWriteMode(WriteMode.Copy);
        this.SetTextStyle(0, TextOrientation.Horizontal, 1);
        this.SetTextJustify(TextJustification.Left, TextJustification.Top);
    }

    // Invert the pixels in the given region
    public static Invert(AX1: number, AY1: number, AX2: number, AY2: number): void {
        // Adjust for modified viewport, if necessary
        if ((this._ViewPortSettings.Clip) && (!this._ViewPortSettings.FullScreen)) {
            // Convert to global coordinates
            AX1 += this._ViewPortSettings.x1
				AY1 += this._ViewPortSettings.y1;
            AX2 += this._ViewPortSettings.x1;
            AY2 += this._ViewPortSettings.y1;

            // Ensure that x1 and y1 are in the visible viewport
            if ((AX1 > this._ViewPortSettings.x2) || (AY1 > this._ViewPortSettings.y2)) return;

            // Make sure x2 and y2 don't exceed the visible viewport
            AX2 = Math.min(AX2, this._ViewPortSettings.x2);
            AY2 = Math.min(AY2, this._ViewPortSettings.y2);
        }

        // Indicate that we need to repaint
        this._Dirty = DirtyType.Pixel;

        var XOffset: number = AX1 + (AY1 * this.PIXELS_X);
        var RowSkip: number = ((this.PIXELS_X - 1) - AX2) + (AX1)

			for (var y: number = AY1; y <= AY2; y++) {
            for (var x: number = AX1; x <= AX2; x++) {
                this._Pixels[XOffset] = this._Pixels[XOffset++] ^ 0x00FFFFFF; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(XOffset, this._Pixels[XOffset++] ^ 0x00FFFFFF);
            }
            XOffset += RowSkip;
        }
    }

    private static HLine(x: number, x2: number, y: number): void {
        var xtmp: number;
        /*{ must we swap the values? }*/
        if (x >= x2) {
            xtmp = x2;
            x2 = x;
            x = xtmp;
        }
        // TODO Optimization
        /*{ First convert to global coordinates }*/
        /*x   = x + this._ViewPortSettings.x1;
        x2  = x2 + this._ViewPortSettings.x1;
        y   = y + this._ViewPortSettings.y1;
        if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen)
        {
            if (LineClipped(x,y,x2,y,this._ViewPortSettings.x1,this._ViewPortSettings.y1,this._ViewPortSettings.x2, this._ViewPortSettings.y2)) return;
        }
        for (x = x; x <= x2; x++)
        {
            this._Pixels[x + (y * this.PIXELS_X)] = this.CURRENT_PALETTE[this._Colour];
        }*/
        for (x = x; x <= x2; x++) {
            this.PutPixel(x, y, this._Colour);
        }
    }


    private static VLine(x: number, y: number, y2: number): void {
        var ytmp: number;
        /*{ must we swap the values? }*/
        if (y >= y2) {
            ytmp = y2;
            y2 = y;
            y = ytmp;
        }
        // TODO Optimization
        /*{ First convert to global coordinates }*/
        /*x   = x + this._ViewPortSettings.x1;
        y2  = y2 + this._ViewPortSettings.y1;
        y   = y + this._ViewPortSettings.y1;
        if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen)
        {
            if (LineClipped(x,y,x,y2,this._ViewPortSettings.x1,this._ViewPortSettings.y1,this._ViewPortSettings.x2, this._ViewPortSettings.y2)) return;
        }
        for (y = y; y <= y2; y++) 
        {
            this._Pixels[x + (y * this.PIXELS_X)] = this.CURRENT_PALETTE[this._Colour];
        }*/
        for (y = y; y <= y2; y++) {
            this.PutPixel(x, y, this._Colour);
        }
    }

    // Draws a line from the point (x1, y1) to (x2, y2).
    // Draws a line in the style and thickness defined by SetLineStyle and uses the
    // color set by SetColor. Use SetWriteMode to determine whether the line is
    // copied or XOR'd to the screen.
    public static Line(x1: number, y1: number, x2: number, y2: number): void {
        var x: number;
        var y: number;
        var deltax: number;
        var deltay: number;
        var d: number;
        var dinc1: number;
        var dinc2: number;
        var xinc1: number;
        var xinc2: number;
        var yinc1: number;
        var yinc2: number;
        var i: number;
        var flag: Boolean;
        var numpixels: number;
        var pixelcount: number;
        var swtmp: number;
        var tmpnumpixels: number;

        /*{******************************************}
        {  SOLID LINES                             }
        {******************************************}*/
        if (this._LineSettings.Style == LineStyle.Solid) {
            /*{ we separate normal and thick width for speed }
            { and because it would not be 100% compatible  }
            { with the TP graph unit otherwise             }*/
            if (y1 == y2) {
                /*{******************************************}
                {  SOLID LINES HORIZONTAL                  }
                {******************************************}*/
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    this.HLine(x1, x2, y2)
					} else {
                    /*{ thick width }*/
                    this.HLine(x1, x2, y2 - 1);
                    this.HLine(x1, x2, y2);
                    this.HLine(x2, x2, y2 + 1);
                }
            } else if (x1 == x2) {
                /*{******************************************}
                {  SOLID LINES VERTICAL                    }
                {******************************************}*/
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    this.VLine(x1, y1, y2)
					} else {
                    /*{ thick width }*/
                    this.VLine(x1 - 1, y1, y2);
                    this.VLine(x1, y1, y2);
                    this.VLine(x1 + 1, y1, y2);
                }
            } else {
                // TODO Optimization
                /*{ Convert to global coordinates. }*/
                /*x1 = x1 + this._ViewPortSettings.x1;
                x2 = x2 + this._ViewPortSettings.x1;
                y1 = y1 + this._ViewPortSettings.y1;
                y2 = y2 + this._ViewPortSettings.y1;
                /*{ if fully clipped then exit... }*/
                /*if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen) {
                    if (LineClipped(x1,y1,x2,y2,this._ViewPortSettings.x1, this._ViewPortSettings.y1, this._ViewPortSettings.x2, this._ViewPortSettings.y2)) return;
                }*/

                /*{******************************************}
                {  SLOPED SOLID LINES                      }
                {******************************************}*/
                /*{ Calculate deltax and deltay for initialisation }*/
                deltax = Math.abs(x2 - x1);
                deltay = Math.abs(y2 - y1);

                /*{ Initialize all vars based on which is the independent variable }*/
                if (deltax >= deltay) {
                    flag = false;
                    /*{ x is independent variable }*/
                    numpixels = deltax + 1;
                    d = (2 * deltay) - deltax;
                    dinc1 = deltay << 1;
                    dinc2 = (deltay - deltax) << 1;
                    xinc1 = 1;
                    xinc2 = 1;
                    yinc1 = 0;
                    yinc2 = 1;
                } else {
                    flag = true;
                    /*{ y is independent variable }*/
                    numpixels = deltay + 1;
                    d = (2 * deltax) - deltay;
                    dinc1 = deltax << 1;
                    dinc2 = (deltax - deltay) << 1;
                    xinc1 = 0;
                    xinc2 = 1;
                    yinc1 = 1;
                    yinc2 = 1;
                }

                /*{ Make sure x and y move in the right directions }*/
                if (x1 > x2) {
                    xinc1 = - xinc1;
                    xinc2 = - xinc2;
                }
                if (y1 > y2) {
                    yinc1 = - yinc1;
                    yinc2 = - yinc2;
                }

                /*{ Start drawing at <x1, y1> }*/
                x = x1;
                y = y1;

                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    /*{ Draw the pixels }*/
                    for (i = 1; i <= numpixels; i++) {
                        this.PutPixel(x, y, this._Colour);//DirectPutPixel(x, y);
                        if (d < 0) {
                            d = d + dinc1;
                            x = x + xinc1;
                            y = y + yinc1;
                        } else {
                            d = d + dinc2;
                            x = x + xinc2;
                            y = y + yinc2;
                        }
                    }
                } else {
                    /*{ Thick width lines }
                    { Draw the pixels }*/
                    for (i = 1; i <= numpixels; i++) {
                        /*{ all depending on the slope, we can determine         }
                        { in what direction the extra width pixels will be put }*/
                        if (flag) {
                            this.PutPixel(x - 1, y, this._Colour);//DirectPutPixelClip(x-1,y);
                            this.PutPixel(x, y, this._Colour);//DirectPutPixelClip(x,y);
                            this.PutPixel(x + 1, y, this._Colour);//DirectPutPixelClip(x+1,y);
                        } else {
                            this.PutPixel(x, y - 1, this._Colour);//DirectPutPixelClip(x, y-1);
                            this.PutPixel(x, y, this._Colour);//DirectPutPixelClip(x, y);
                            this.PutPixel(x, y + 1, this._Colour);//DirectPutPixelClip(x, y+1);
                        }

                        if (d < 0) {
                            d = d + dinc1;
                            x = x + xinc1;
                            y = y + yinc1;
                        } else {
                            d = d + dinc2;
                            x = x + xinc2;
                            y = y + yinc2;
                        }
                    }
                }
            }
        } else {
            /*{******************************************}
            {  begin patterned lines                   }
            {******************************************}*/
            // TODO Optimization
            /*{ Convert to global coordinates. }*/
            /*x1 = x1 + this._ViewPortSettings.x1;
            x2 = x2 + this._ViewPortSettings.x1;
            y1 = y1 + this._ViewPortSettings.y1;
            y2 = y2 + this._ViewPortSettings.y1;*/
            /*{ if fully clipped then exit... }*/
            /*if (this._ViewPortSettings.Clip && !this._ViewPortSettings.FullScreen)
            {
                if (LineClipped(x1,y1,x2,y2,this._ViewPortSettings.x1, this._ViewPortSettings.y1, this._ViewPortSettings.x2, this._ViewPortSettings.y2)) return;
            }*/

            pixelcount = 0;
            if (y1 == y2) {
                /*{ Check if we must swap }*/
                if (x1 >= x2) {
                    swtmp = x1;
                    x1 = x2;
                    x2 = swtmp;
                }
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    for (pixelcount = x1; pixelcount <= x2; pixelcount++) {
                        /*{ optimization: PixelCount mod 16 }*/
                        if ((this._LineSettings.Pattern & (1 << (pixelcount & 15))) != 0) {
                            this.PutPixel(pixelcount, y2, this._Colour);//DirectPutPixel(PixelCount,y2);
                        }
                    }
                } else {
                    for (i = -1; i <= 1; i++) {
                        for (pixelcount = x1; pixelcount <= x2; pixelcount++) {
                            /*{ Optimization from Thomas - mod 16 = and 15 }
                            {this optimization has been performed by the compiler
                                for while as well (JM)}*/
                            if ((this._LineSettings.Pattern & (1 << (pixelcount & 15))) != 0) {
                                // TODO Need to clip
                                this.PutPixel(pixelcount, y2 + i, this._Colour);//DirectPutPixelClip(PixelCount,y2+i);
                            }
                        }
                    }
                }
            } else if (x1 == x2) {
                /*{ Check if we must swap }*/
                if (y1 >= y2) {
                    swtmp = y1;
                    y1 = y2;
                    y2 = swtmp;
                }
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    for (pixelcount = y1; pixelcount <= y2; pixelcount++) {
                        /*{ compare if we should plot a pixel here , compare }
                        { with predefined line patterns...                 }*/
                        if ((this._LineSettings.Pattern & (1 << (pixelcount & 15))) != 0) {
                            this.PutPixel(x1, pixelcount, this._Colour);//DirectPutPixel(x1,PixelCount);
                        }
                    }
                } else {
                    for (i = -1; i <= 1; i++) {
                        for (pixelcount = y1; pixelcount <= y2; pixelcount++) {
                            /*{ compare if we should plot a pixel here , compare }
                            { with predefined line patterns...                 }*/
                            if ((this._LineSettings.Pattern & (1 << (pixelcount & 15))) != 0) {
                                // TODO Need to clip	
                                this.PutPixel(x1 + i, pixelcount, this._Colour);//DirectPutPixelClip(x1+i,PixelCount);
                            }
                        }
                    }
                }
            } else {
                /*{ Calculate deltax and deltay for initialisation }*/
                deltax = Math.abs(x2 - x1);
                deltay = Math.abs(y2 - y1);

                /*{ Initialize all vars based on which is the independent variable }*/
                if (deltax >= deltay) {
                    flag = false;
                    /*{ x is independent variable }*/
                    numpixels = deltax + 1;
                    d = (2 * deltay) - deltax;
                    dinc1 = deltay << 1;
                    dinc2 = (deltay - deltax) << 1;
                    xinc1 = 1;
                    xinc2 = 1;
                    yinc1 = 0;
                    yinc2 = 1;
                } else {
                    flag = true;
                    /*{ y is independent variable }*/
                    numpixels = deltay + 1;
                    d = (2 * deltax) - deltay;
                    dinc1 = deltax << 1;
                    dinc2 = (deltax - deltay) << 1;
                    xinc1 = 0;
                    xinc2 = 1;
                    yinc1 = 1;
                    yinc2 = 1;
                }

                /*{ Make sure x and y move in the right directions }*/
                if (x1 > x2) {
                    xinc1 = - xinc1;
                    xinc2 = - xinc2;
                }
                if (y1 > y2) {
                    yinc1 = - yinc1;
                    yinc2 = - yinc2;
                }

                /*{ Start drawing at <x1, y1> }*/
                x = x1;
                y = y1;

                if (this._LineSettings.Thickness == LineThickness.Thick) {
                    tmpnumpixels = numpixels - 1;
                    /*{ Draw the pixels }*/
                    for (i = 0; i <= tmpnumpixels; i++) {
                        /*{ all depending on the slope, we can determine         }
                        { in what direction the extra width pixels will be put }*/
                        if (flag) {
                            /*{ compare if we should plot a pixel here , compare }
                            { with predefined line patterns...                 }*/
                            if ((this._LineSettings.Pattern & (1 << (i & 15))) != 0) {
                                this.PutPixel(x - 1, y, this._Colour);//DirectPutPixelClip(x-1,y);
                                this.PutPixel(x, y, this._Colour);//DirectPutPixelClip(x,y);
                                this.PutPixel(x + 1, y, this._Colour);//DirectPutPixelClip(x+1,y);
                            }
                        } else {
                            /*{ compare if we should plot a pixel here , compare }
                            { with predefined line patterns...                 }*/
                            if ((this._LineSettings.Pattern & (1 << (i & 15))) != 0) {
                                this.PutPixel(x, y - 1, this._Colour);//DirectPutPixelClip(x,y-1);
                                this.PutPixel(x, y, this._Colour);//DirectPutPixelClip(x,y);
                                this.PutPixel(x, y + 1, this._Colour);//DirectPutPixelClip(x,y+1);
                            }
                        }

                        if (d < 0) {
                            d = d + dinc1;
                            x = x + xinc1;
                            y = y + yinc1;
                        } else {
                            d = d + dinc2;
                            x = x + xinc2;
                            y = y + yinc2;
                        }
                    }
                } else {
                    /*{ instead of putting in loop , substract by one now }*/
                    tmpnumpixels = numpixels - 1;
                    /*{ NormWidth }*/
                    for (i = 0; i <= tmpnumpixels; i++) {
                        if ((this._LineSettings.Pattern & (1 << (i & 15))) != 0) {
                            this.PutPixel(x, y, this._Colour);//DirectPutPixel(x,y);
                        }
                        if (d < 0) {
                            d = d + dinc1;
                            x = x + xinc1;
                            y = y + yinc1;
                        } else {
                            d = d + dinc2;
                            x = x + xinc2;
                            y = y + yinc2;
                        }
                    }
                }
            }
            /*{******************************************}
            {  end patterned lines                     }
            {******************************************}*/
        }
    }

    public static yLine(x0: number, y0: number, x1: number, y1: number): void {
        if (this._WriteMode == WriteMode.XOR) {
            //TODO trace("Line() doesn't support XOR write mode");
        }

        var x: number;
        var y: number;
        var Start: number;
        var End: number;
        var dx: number;
        var dy: number;
        var x0minus: number;
        var x0plus: number;
        var y0minus: number;
        var y0plus: number;
        var m: number;
        var b: number;

        if (this._LineSettings.Style == LineStyle.Solid) {
            // Calculate dx (and check if vertical)
            dx = x1 - x0;
            if (dx == 0) {
                Start = Math.min(y0, y1);
                End = Math.max(y0, y1);
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    for (y = Start; y <= End; y++) {
                        this.PutPixel(x0, y, this._Colour);
                    }
                } else {
                    x0minus = x0 - 1;
                    x0plus = x0 + 1;

                    for (y = Start; y <= End; y++) {
                        this.PutPixel(x0minus, y, this._Colour);
                        this.PutPixel(x0, y, this._Colour);
                        this.PutPixel(x0plus, y, this._Colour);
                    }
                }
                return;
            }

            // Calculate dy (and check if horizontal)
            dy = y1 - y0;
            if (dy == 0) {
                Start = Math.min(x0, x1);
                End = Math.max(x0, x1);
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    for (x = Start; x <= End; x++) {
                        this.PutPixel(x, y0, this._Colour);
                    }
                } else {
                    y0minus = y0 - 1;
                    y0plus = y0 + 1;

                    for (x = Start; x <= End; x++) {
                        this.PutPixel(x, y0minus, this._Colour);
                        this.PutPixel(x, y0, this._Colour);
                        this.PutPixel(x, y0plus, this._Colour);
                    }
                }
                return;
            }

            // Calculate m and b
            m = dy / dx;
            b = y0 - (m * x0);

            // Solve for y using y=mx+b
            Start = Math.min(x0, x1);
            End = Math.max(x0, x1);
            if (this._LineSettings.Thickness == LineThickness.Normal) {
                for (x = Start; x <= End; x++) {
                    y = Math.round((m * x) + b);
                    this.PutPixel(x, y, this._Colour);
                }
            } else {
                if (dx >= dy) {
                    for (x = Start; x <= End; x++) {
                        y = Math.round((m * x) + b);
                        this.PutPixel(x, y - 1, this._Colour);
                        this.PutPixel(x, y, this._Colour);
                        this.PutPixel(x, y + 1, this._Colour);
                    }
                } else {
                    for (x = Start; x <= End; x++) {
                        y = Math.round((m * x) + b);
                        this.PutPixel(x - 1, y, this._Colour);
                        this.PutPixel(x, y, this._Colour);
                        this.PutPixel(x + 1, y, this._Colour);
                    }
                }
            }

            // Solve for x using x=(y-b)/m
            Start = Math.min(y0, y1);
            End = Math.max(y0, y1);
            if (this._LineSettings.Thickness == LineThickness.Normal) {
                for (y = Start; y <= End; y++) {
                    x = Math.round((y - b) / m);
                    this.PutPixel(x, y, this._Colour);
                }
            } else {
                if (dx >= dy) {
                    for (y = Start; y <= End; y++) {
                        x = Math.round((y - b) / m);
                        this.PutPixel(x, y - 1, this._Colour);
                        this.PutPixel(x, y, this._Colour);
                        this.PutPixel(x, y + 1, this._Colour);
                    }
                } else {
                    for (y = Start; y <= End; y++) {
                        x = Math.round((y - b) / m);
                        this.PutPixel(x - 1, y, this._Colour);
                        this.PutPixel(x, y, this._Colour);
                        this.PutPixel(x + 1, y, this._Colour);
                    }
                }
            }
        } else {
            var i: number = 0;

            // Calculate dx (and check if vertical)
            dx = x1 - x0;
            if (dx == 0) {
                Start = Math.min(y0, y1);
                End = Math.max(y0, y1);
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    for (y = Start; y <= End; y++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) this.PutPixel(x0, y, this._Colour);
                    }
                } else {
                    x0minus = x0 - 1;
                    x0plus = x0 + 1;

                    for (y = Start; y <= End; y++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                            this.PutPixel(x0minus, y, this._Colour);
                            this.PutPixel(x0, y, this._Colour);
                            this.PutPixel(x0plus, y, this._Colour);
                        }
                    }
                }
                return;
            }

            // Calculate dy (and check if horizontal)
            dy = y1 - y0;
            if (dy == 0) {
                Start = Math.min(x0, x1);
                End = Math.max(x0, x1);
                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    for (x = Start; x <= End; x++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) this.PutPixel(x, y0, this._Colour);
                    }
                } else {
                    y0minus = y0 - 1;
                    y0plus = y0 + 1;

                    for (x = Start; x <= End; x++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                            this.PutPixel(x, y0minus, this._Colour);
                            this.PutPixel(x, y0, this._Colour);
                            this.PutPixel(x, y0plus, this._Colour);
                        }
                    }
                }
                return;
            }

            // Calculate m and b
            m = dy / dx;
            b = y0 - (m * x0);

            // Solve for y using y=mx+b
            Start = Math.min(x0, x1);
            End = Math.max(x0, x1);
            if (this._LineSettings.Thickness == LineThickness.Normal) {
                for (x = Start; x <= End; x++) {
                    if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                        y = Math.round((m * x) + b);
                        this.PutPixel(x, y, this._Colour);
                    }
                }
            } else {
                if (dx >= dy) {
                    for (x = Start; x <= End; x++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                            y = Math.round((m * x) + b);
                            this.PutPixel(x, y - 1, this._Colour);
                            this.PutPixel(x, y, this._Colour);
                            this.PutPixel(x, y + 1, this._Colour);
                        }
                    }
                } else {
                    for (x = Start; x <= End; x++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                            y = Math.round((m * x) + b);
                            this.PutPixel(x - 1, y, this._Colour);
                            this.PutPixel(x, y, this._Colour);
                            this.PutPixel(x + 1, y, this._Colour);
                        }
                    }
                }
            }

            // Solve for x using x=(y-b)/m
            Start = Math.min(y0, y1);
            End = Math.max(y0, y1);
            if (this._LineSettings.Thickness == LineThickness.Normal) {
                for (y = Start; y <= End; y++) {
                    if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                        x = Math.round((y - b) / m);
                        this.PutPixel(x, y, this._Colour);
                    }
                }
            } else {
                if (dx >= dy) {
                    for (y = Start; y <= End; y++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                            x = Math.round((y - b) / m);
                            this.PutPixel(x, y - 1, this._Colour);
                            this.PutPixel(x, y, this._Colour);
                            this.PutPixel(x, y + 1, this._Colour);
                        }
                    }
                } else {
                    for (y = Start; y <= End; y++) {
                        if ((this._LineSettings.Pattern & (1 << (i++ & 15))) != 0) {
                            x = Math.round((y - b) / m);
                            this.PutPixel(x - 1, y, this._Colour);
                            this.PutPixel(x, y, this._Colour);
                            this.PutPixel(x + 1, y, this._Colour);
                        }
                    }
                }
            }
        }
    }

    public static xLine(AX1: number, AY1: number, AX2: number, AY2: number): void {
        if (this._LineSettings.Style != LineStyle.Solid) {
            //TODO trace("Line() only supports solid line types");
            this._LineSettings.Style = LineStyle.Solid;
            this._LineSettings.Pattern = 0xFFFF;
        }
        if (this._WriteMode == WriteMode.XOR) {
            //TODO trace("Line() doesn't support XOR write mode");
        }

        var i: number;
        var x: number;
        var y: number;

        if (this._LineSettings.Style == LineStyle.Solid) {
            // Solid lines
            if (AX1 == AX2) {
                // Vertical solid
                var YStart: number = Math.min(AY1, AY2);
                var YEnd: number = Math.max(AY1, AY2);

                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    // Vertical solid normal
                    for (y = YStart; y <= YEnd; y++) {
                        // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                        this.PutPixel(AX1, y, this._Colour);
                    }
                } else {
                    // Vertical solid thick
                    for (y = YStart; y <= YEnd; y++) {
                        // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                        this.PutPixel(AX1 - 1, y, this._Colour);
                        this.PutPixel(AX1, y, this._Colour);
                        this.PutPixel(AX1 + 1, y, this._Colour);
                    }
                }
            } else if (AY1 == AY2) {
                // Horizontal solid
                var XStart: number = Math.min(AX1, AX2);
                var XEnd: number = Math.max(AX1, AX2);

                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    // Horizontal solid normal
                    for (x = XStart; x <= XEnd; x++) {
                        // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                        this.PutPixel(x, AY1, this._Colour);
                    }
                } else {
                    // Horizontal solid thick
                    for (x = XStart; x <= XEnd; x++) {
                        // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                        this.PutPixel(x, AY1 - 1, this._Colour);
                        this.PutPixel(x, AY1, this._Colour);
                        this.PutPixel(x, AY1 + 1, this._Colour);
                    }
                }
            } else {
                // Sloped solid

                // Calculate deltax and deltay for initialisation
                var deltax: number = Math.abs(AX2 - AX1);
                var deltay: number = Math.abs(AY2 - AY1);

                // Initialize all vars based on which is the independent variable
                var yslopesmore: Boolean;
                var numpixels: number;
                var d: number;
                var dinc1: number;
                var dinc2: number;
                var xinc1: number;
                var xinc2: number;
                var yinc1: number;
                var yinc2: number;;
                if (deltax >= deltay) {
                    // x is independent variable
                    yslopesmore = false;
                    numpixels = deltax + 1;
                    d = (2 * deltay) - deltax;
                    dinc1 = deltay << 1;
                    dinc2 = (deltay - deltax) << 1;
                    xinc1 = 1;
                    xinc2 = 1;
                    yinc1 = 0;
                    yinc2 = 1;
                } else {
                    // y is independent variable
                    yslopesmore = true;
                    numpixels = deltay + 1;
                    d = (2 * deltax) - deltay;
                    dinc1 = deltax << 1;
                    dinc2 = (deltax - deltay) << 1;
                    xinc1 = 0;
                    xinc2 = 1;
                    yinc1 = 1;
                    yinc2 = 1;
                }

                // Make sure x and y move in the right directions
                if (AX1 > AX2) {
                    xinc1 *= -1;
                    xinc2 *= -1;
                }
                if (AY1 > AY2) {
                    yinc1 *= -1;
                    yinc2 *= -1;
                }

                // Start drawing at <x1, y1>
                x = AX1;
                y = AY1;

                if (this._LineSettings.Thickness == LineThickness.Normal) {
                    // Sloped solid normal
                    for (i = 1; i <= numpixels; i++) {
                        // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                        this.PutPixel(x, y, this._Colour);

                        if (d <= 0) { // TODO Used to be < 0, testing wtih <= 0
                            d = d + dinc1;
                            x = x + xinc1;
                            y = y + yinc1;
                        } else {
                            d = d + dinc2;
                            x = x + xinc2;
                            y = y + yinc2;
                        }
                    }
                } else {
                    // Solid sloped thick
                    for (i = 1; i <= numpixels; i++) {
                        // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                        // all depending on the slope, we can determine in what direction the extra width pixels will be put
                        if (yslopesmore) {
                            this.PutPixel(x - 1, y, this._Colour);
                            this.PutPixel(x, y, this._Colour);
                            this.PutPixel(x + 1, y, this._Colour);
                        } else {
                            this.PutPixel(x, y - 1, this._Colour);
                            this.PutPixel(x, y, this._Colour);
                            this.PutPixel(x, y + 1, this._Colour);
                        }

                        if (d <= 0) { // TODO Testing
                            d = d + dinc1;
                            x = x + xinc1;
                            y = y + yinc1;
                        } else {
                            d = d + dinc2;
                            x = x + xinc2;
                            y = y + yinc2;
                        }
                    }
                }
            }
        } else {
            // TODO Pattern lines
        }
    }

    // Moves the current pointer (CP) to (X,Y)
    // The CP is similar to a text mode cursor except that the CP is not visible
    // The following routines move the CP:
    // ClearDevice
    // ClearViewPort
    // GraphDefaults
    // InitGraph
    // LineRel
    // LineTo
    // MoveRel
    // MoveTo
    // OutText
    // SetGraphMode
    // SetViewPort
    // If a viewport is active, the CP will be viewport-relative (the X and Y
    // values will be added to the viewport's X1 and Y1 values). The CP is never
    // clipped at the current viewport's boundaries.
    public static MoveTo(AX: number, AY: number): void {
        this._CursorPosition.x = AX;
        this._CursorPosition.y = AY;
    }

    private static OnExitFrame(e: Event): void {
        if (this._Dirty != DirtyType.None) {
            this._Dirty = DirtyType.None;
            this._Bitmap.bitmapData.setVector(new Rectangle(0, 0, this.PIXELS_X, this.PIXELS_Y), this._Pixels);
        }
    }

    // Sends a string to the output device at the current pointer.
    // Displays TextString at the CP using the current justification settings.
    // TextString is truncated at the viewport border if it is too long.
    //	- If one of the stroked fonts is active, TextString is truncated at the
    //    screen boundary if it is too long.
    //	- If the default (bit-mapped) font is active and the string is too long to
    //    fit on the screen, no text is displayed.
    // OutText uses the font set by SetTextStyle. To maintain code compatibility
    // when using several fonts, use the TextWidth and TextHeight calls to
    // determine the dimensions of the string.
    // OutText uses the output options set by SetTextJustify (justify, center,
    // rotate 90 degrees, and so on).
    public static OutText(AText: string): void {
        this.OutTextXY(this._CursorPosition.x, this._CursorPosition.y, AText);
        if ((this._TextSettings.Direction == TextOrientation.Horizontal) && (this._TextSettings.HorizontalAlign == TextJustification.Left)) {
            this._CursorPosition.x += this.TextWidth(AText);
            if (this._CursorPosition.x > 639) this._CursorPosition.x = 639;
        }
    }

    // Sends a string to the output device.
    // Displays TextString at (X, Y). TextString is truncated at the viewport
    // border if it is too long. If one of the stroked fonts is active, TextString
    // is truncated at the screen boundary if it is too long. If the default
    // (bit-mapped) font is active and the string is too long to fit on the screen,
    // no text is displayed.
    // Use OutText to output text at the current pointer; use OutTextXY to output
    // text elsewhere on the screen.
    // OutTextXY uses the font set by SetTextStyle. To maintain code compatibility
    // when using several fonts, use the TextWidth and TextHeight calls to
    // determine the dimensions of the string.
    // OutTextXY uses the output options set by SetTextJustify (justify, center,
    // rotate 90 degrees, and so on).
    public static OutTextXY(AX: number, AY: number, AText: string): void {
        var ATextlength: number = AText.length;

        // Store values for putting back later
        var OldLinePattern: number = this._LineSettings.Pattern;
        var OldLineStyle: number = this._LineSettings.Style;
        var OldLineThickness: number = this._LineSettings.Thickness;

        // Set values for text output
        this._LineSettings.Pattern = 0xFFFF;
        this._LineSettings.Style = LineStyle.Solid;
        this._LineSettings.Thickness = LineThickness.Normal;

        var i: number;
        if (this._TextSettings.Font == 0) {
            // Bitmap font				
            for (i = 0; i < ATextlength; i++) {
                var Code: number = AText.charCodeAt(i);

                if (this._TextSettings.Direction == TextOrientation.Vertical) {
                    // Vertical
                    if (this._TextSettings.Size == 1) {
                        // TODO Vertical Normal Size
                    } else {
                        // TODO Vertical Scaled Size
                    }

                    // Move over the width of the character
                    AY -= 8 * this._TextSettings.Size;
                } else {
                    // Horizontal
                    if (this._TextSettings.Size == 1) {
                        // Horizontal Normal Size
                        for (var y: number = 0; y < 8; y++) {
                            for (var x: number = 0; x < 8; x++) {
                                if (BitmapFont.Pixels[Code][y][x] != 0) {
                                    // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                                    this.PutPixel(AX + x, AY + y, this._Colour);
                                }
                            }
                        }
                    } else {
                        // Horizontal Scaled Size
                        var yy: number = 0;
                        var cnt3: number = 0;

                        while (yy <= 7) {
                            for (var cnt4: number = 0; cnt4 < this._TextSettings.Size; cnt4++) {
                                var xx: number = 0;
                                var cnt2: number = 0;
                                while (xx <= 7) {
                                    for (var cnt1: number = 0; cnt1 < this._TextSettings.Size; cnt1++) {
                                        if (BitmapFont.Pixels[Code][yy][xx] != 0) {
                                            // TODO clip ahead of time so we can set colour via this._Pixels[] directly?
                                            this.PutPixel(AX + cnt1 + cnt2, AY + cnt3 + cnt4, this._Colour);
                                        }
                                    }
                                    xx++;
                                    cnt2 += this._TextSettings.Size;
                                }
                            }
                            yy++;
                            cnt3 += this._TextSettings.Size;
                        }
                    }

                    // Move over the width of the character
                    AX += 8 * this._TextSettings.Size;
                }
            }
        } else {
            // Stroke font
            for (i = 0; i < ATextlength; i++) {
                var LastPoint: Point = new Point(AX, AY);
                var NextPoint: Point = new Point(AX, AY);

                var Strokes: [] = StrokeFont.Strokes[this._TextSettings.Font - 1][AText.charCodeAt(i)];
                var Strokeslength: number = Strokes.length;
                for (var j: number = 1; j < Strokeslength; j++) {
                    if (this._TextSettings.Direction == TextOrientation.Vertical) {
                        NextPoint.x = AX + Math.floor(Strokes[j][2] * this._TextSettings.StrokeScaleY); // TODO Is this right to flip Y and X?
                        NextPoint.y = AY - Math.floor(Strokes[j][1] * this._TextSettings.StrokeScaleX); // TODO Is this right to flip Y and X?
                    } else {
                        NextPoint.x = AX + Math.floor(Strokes[j][1] * this._TextSettings.StrokeScaleX);
                        NextPoint.y = AY + Math.floor(Strokes[j][2] * this._TextSettings.StrokeScaleY);
                    }

                    if (Strokes[j][0] == StrokeFont.DRAW) {
                        this.Line(LastPoint.x, LastPoint.y, NextPoint.x, NextPoint.y);
                    }

                    LastPoint.x = NextPoint.x;
                    LastPoint.y = NextPoint.y;
                }

                // Move over the width of the character
                if (this._TextSettings.Direction == TextOrientation.Vertical) {
                    AY -= Math.floor(Strokes[0] * this._TextSettings.StrokeScaleX); // TODO Is it right to use X here and not Y?
                } else {
                    AX += Math.floor(Strokes[0] * this._TextSettings.StrokeScaleX);
                }
            }
        }

        // Reset original values
        this._LineSettings.Pattern = OldLinePattern;
        this._LineSettings.Style = OldLineStyle;
        this._LineSettings.Thickness = OldLineThickness;
    }

    // Draws and fills a pie slice
    // (X,Y) is the center point. The pie slice starts at StAngle, ends at
    // EndAngle.
    public static PieSlice(AX: number, AY: number, AStartAngle: number, AEndAngle: number, ARadius: number): void {
        this.Sector(AX, AY, AStartAngle, AEndAngle, ARadius, Math.floor(ARadius * this.ASPECT_RATIO));
    }

    // Check if the given point is inside the given polygon
    // Adapted from http://www.alienryderflex.com/polygon/
    public static xPointInPoly(AX: number, AY: number, APoints: Point[]): Boolean {
        var i: number;
        var j: number = APoints.length - 1;
        var oddNodes: Boolean = false;

        var APointslength: number = APoints.length;
        for (i = 0; i < APointslength; i++) {
            if ((APoints[i].y < AY && APoints[j].y >= AY || APoints[j].y < AY && APoints[i].y >= AY) && (APoints[i].x <= AX || APoints[j].x <= AX)) {
                if (APoints[i].x + (AY - APoints[i].y) / (APoints[j].y - APoints[i].y) * (APoints[j].x - APoints[i].x) < AX) {
                    oddNodes = !oddNodes;
                }
            }
            j = i;
        }

        return oddNodes;
    }

    // Check if the given point is inside the given polygon
    // Adapted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    public static PointInPoly(AX: number, AY: number, APoints: Point[]): Boolean {
        var i: number = 0;
        var j: number = 0;
        var c: Boolean = false;

        var APointslength: number = APoints.length;
        for (i = 0, j = APointslength - 1; i < APointslength; j = i++) {
            if (((APoints[i].y > AY) != (APoints[j].y > AY)) && (AX < (APoints[j].x - APoints[i].x) * (AY - APoints[i].y) / (APoints[j].y - APoints[i].y) + APoints[i].x))
                c = !c;
        }
        return c;
    }

    // Puts a bit image onto the screen.
    // (X, Y) is the upper left corner of a rectangular region on the screen.
    // BitMap is an untyped parameter that contains the height and width of the
    // region, and the bit image that will be put onto the screen. BitBlt specifies
    // which binary operator will be used to put the bit image onto the screen.
    // Each constant corresponds to a binary operation. For example:
    // PutImage(X, Y, BitMap, NormalPut) puts the image stored in BitMap at (X, Y)
    // using the assembly language MOV instruction for each byte in the image.
    // PutImage(X, Y, BitMap, XORPut) puts the image stored in BitMap at (X, Y)
    // using the assembly language XOR instruction for each byte in the image. This
    // is an often-used animation technique for "dragging" an image around the
    // screen.
    // PutImage(X, Y, BitMap, NotPut) inverts the bits in BitMap and then puts the
    // image stored in BitMap at (X, Y) using the assembly language MOV for each
    // byte in the image. Thus, the image appears in inverse video of the original
    // BitMap.
    public static PutImage(AX: number, AY: number, ABitMap: BitmapData, ABitBlt: number): void {
        // Check for out out bound coordinates
        if ((AX < 0) || (AY < 0) || (AX >= this.PIXELS_X) || (AY >= this.PIXELS_Y)) return;

        if (ABitBlt != WriteMode.Copy) {
            //TODO trace("PutImage() only supports COPY mode");
            ABitBlt = WriteMode.Copy;
        }

        if (ABitMap != null) {
            var AX1: number = AX;
            var AY1: number = AY;
            var AX2: number = AX1 + ABitMap.width - 1;
            var AY2: number = AY1 + ABitMap.height - 1;

            // Ensure valid right and bottom
            if (AX2 >= this.PIXELS_X) AX2 = (this.PIXELS_X - 1);
            if (AY2 >= this.PIXELS_Y) AY2 = (this.PIXELS_Y - 1);

            // Indicate that we need to repaint
            this._Dirty = DirtyType.Pixel;

            var V: number[] = ABitMap.getVector(new Rectangle(0, 0, ABitMap.width, ABitMap.height));

            var InOffset: number = 0;
            var OutOffset: number = AX1 + (AY1 * this.PIXELS_X);
            var RowSkip: number = ((this.PIXELS_X - 1) - AX2) + (AX1);
            for (var y: number = AY1; y <= AY2; y++) {
                for (var x: number = AX1; x <= AX2; x++) {
                    this._Pixels[OutOffset++] = V[InOffset++]; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(OutOffset++, V[InOffset++]);
                }
                OutOffset += RowSkip;
            }
        }
    }

    // Plots a pixel at X,Y
    // Plots a point in the color defined by Pixel at (X, Y).
    public static PutPixelDefault(AX: number, AY: number, APaletteIndex: number): void {
        // Check for out out bound coordinates
        if ((AX < 0) || (AY < 0) || (AX >= this.PIXELS_X) || (AY >= this.PIXELS_Y)) return;

        if ((this._ViewPortSettings.Clip) && (!this._ViewPortSettings.FullScreen)) {
            // Convert to global coordinates
            AX += this._ViewPortSettings.x1;
            AY += this._ViewPortSettings.y1;

            // Ensure x and y are in the visible viewport
            if (AX > this._ViewPortSettings.x2) return;
            if (AY > this._ViewPortSettings.y2) return;
        }

        // Draw pixel
        var Pos: number = AX + (AY * this.PIXELS_X);
        if ((Pos >= 0) && (Pos < this.PIXELS)) {
            // Indicate that we need to repaint
            this._Dirty = DirtyType.Pixel;
            this._Pixels[Pos] = this.CURRENT_PALETTE[APaletteIndex];
        }
    }

    // Plots a pixel at X,Y
    // Plots a point in the color defined by Pixel at (X, Y).
    public static PutPixelPoly(AX: number, AY: number, APaletteIndex: number): void {
        // Check for out out bound coordinates (PutPixelDefault does this, but it's also important for the this._FillPolyMap line below)
        if ((AX < 0) || (AY < 0) || (AX >= this.PIXELS_X) || (AY >= this.PIXELS_Y)) return;

        // Use the default function to draw the pixel
        this.PutPixelDefault(AX, AY, APaletteIndex);

        // Record the (non-viewport-modified) pixel location if we're filling a polygon
        this._FillPolyMap[AX][AY] = 1;
    }

    // Directly puts the specified colour into the pixel vector
    // Does not adjust for viewport, or test if point is valid, so calling function should do this
    // NB: Takes an actual colour, not a palette index, as a parameter
    // OPTIMIZATION: AVOID FUNCTION CALL public static RawPutPixel(APos: number, AColour: number): void
    //{
    //	this._Pixels[APos] = AColour;
    //}

    // Draws a rectangle, using the current line style and color.
    // (X1, Y1) define the upper left corner of the rectangle, and (X2, Y2) define
    // the lower right corner (0 <= X1 < X2 <= GetMaxX, and 0 <= Y1 < Y2 <=
    // GetMaxY).
    // Draws the rectangle in the current line style and color, as set by
    // SetLineStyle and SetColor. Use SetWriteMode to determine whether the
    // rectangle is copied or XOR'd to the screen.
    public static Rectangle(x1: number, y1: number, x2: number, y2: number): void {
        this.Line(x1, y1, x2, y1);
        this.Line(x2, y1, x2, y2);
        this.Line(x2, y2, x1, y2);
        this.Line(x1, y2, x1, y1);
    }

    // Draws and fills an elliptical sector.
    // Using (X, Y) as the center point, XRadius and YRadius specify the horizontal
    // and vertical radii, respectively; Sector draws from StAngle to EndAngle,
    // outlined in the current color and filled with the pattern and color defined
    // by SetFillStyle or SetFillPattern.
    // A start angle of 0 and an end angle of 360 will draw and fill a complete
    // ellipse. The angles for Arc, Ellipse, FillEllipse, PieSlice, and Sector are
    // counter-clock-wise with 0 degrees at 3 o'clock, 90 degrees at 12 o'clock,
    // and so on.
    public static Sector(AX: number, AY: number, AStartAngle: number, AEndAngle: number, AXRadius: number, AYRadius: number): void {
        this.Ellipse(AX, AY, AStartAngle, AEndAngle, AXRadius, AYRadius);
        // TODO Looks like we need the GetArcCoords() after all!
        // TODO Line(ArcCall.XStart, ArcCall.YStart, x,y);
        // TODO Line(x,y,ArcCall.Xend,ArcCall.YEnd);
    }

    // Changes all palette colors as specified.
    public static SetAllPalette(APalette: number[], AUpdateScreen: Boolean = true): void {
        // OPTIMIZATION: If the last operation was to clear the viewport, and the viewport is the full screen, then
        //               this._Dirty will be DirtyType.Clear.  In this case, we know the screen contains only pixels
        //               coloured in the background colour, so we only need to update the screen pixels for the
        //               background palette entry, and not the subsequent 15 palette entries
        if (this._Dirty == DirtyType.Clear) {
            this.SetPalette(this._BackColour, APalette[this._BackColour], true);
            AUpdateScreen = false;
        }

        var APalettelength: number = APalette.length;
        for (var i: number = 0; i < APalettelength; i++) {
            this.SetPalette(i, APalette[i], AUpdateScreen);
        }
    }

    // Sets the current background color, using the palette.
    // SetBkColor(5) makes the fifth color in the palette the current background color.
    // Background colors can range from 0 to 15, depending on the current graphics
    // driver and current graphics mode.
    // GetMaxColor returns the highest valid color for the current driver and mode.
    public static SetBkColour(AColour: number): void {
        this._BackColour = AColour;
    }

    // Sets the current drawing color, using the palette.
    // SetColor(5) makes the fifth color in the palette the current drawing color.
    // Drawing colors can range from 0 to 15, depending on the current graphics
    // driver and current graphics mode.
    // GetMaxColor returns the highest valid color for the current driver and mode.
    public static SetColour(AColour: number): void {
        if ((AColour < 0) || (AColour > 15)) {
            //TODO trace("Not a valid colour: " + AColour);
            return;
        }
        this._Colour = AColour;
    }

    // Selects a user-defined fill pattern.
    public static SetFillPattern(APattern: number[], AColour: number): void {
        var ANDArray: number[] = [128, 64, 32, 16, 8, 4, 2, 1];

        // Fill pattern vector's first 8 lines
        var XOffset: number = 0;
        for (var y: number = 0; y < 8; y++) {
            for (var x: number = 0; x < this.PIXELS_X; x++) {
                this._FillSettings.Pattern[XOffset++] = ((APattern[y] & ANDArray[x & 7]) == 0) ? 0 : 15; // OPTIMIZATION: AND 7 is the same as MOD 8, but faster!
            }
        }

        // Fill the rest of the pattern vector with the repeating pattern
        XOffset = 0;
        for (var i: number = 640 * 8; i < this.PIXELS; i++) {
            this._FillSettings.Pattern[i] = this._FillSettings.Pattern[XOffset++];
        }

        if ((AColour < 0) || (AColour > 15)) {
            //TODO trace("Invalid fill colour: " + AColour);
        } else {
            this._FillSettings.Colour = AColour;
        }
        this._FillSettings.Style = FillStyle.User;
    }

    public static SetFillSettings(AFillSettings: FillSettings): void {
        this._FillSettings = AFillSettings;
    }

    // Sets the fill pattern and color.
    // Sets the pattern and color for all filling done by FillPoly, Bar, Bar3D, and
    // PieSlice. A variety of fill patterns are available. The default pattern is
    // solid, and the default color is the maximum color in the palette. If invalid
    // input is passed to SetFillStyle, GraphResult returns a value of grError, and
    // the current fill settings will be unchanged. If Pattern equals UserFill, the
    // user-defined pattern (set by a call to SetFillPattern) becomes the active
    // pattern.
    public static SetFillStyle(AStyle: number, AColour: number): void {
        // TODO Should only need to set the pattern if the style is changing, but there was a bug in that somewhere so we're doing it this way for now
        switch (AStyle) {
            // TODO Test each of the fill patterns to ensure they match
            case 0: this.SetFillPattern([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], AColour); break;
            case 1: this.SetFillPattern([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff], AColour); break;
            case 2: this.SetFillPattern([0xff, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00], AColour); break;
            case 3: this.SetFillPattern([0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80], AColour); break;
            case 4: this.SetFillPattern([0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xc1, 0x83], AColour); break;
            case 5: this.SetFillPattern([0x07, 0x83, 0xc1, 0xe0, 0x70, 0x38, 0x1c, 0x0e], AColour); break;
            case 6: this.SetFillPattern([0x5a, 0x2d, 0x96, 0x4b, 0xa5, 0xd2, 0x69, 0xb4], AColour); break;
            case 7: this.SetFillPattern([0xff, 0x88, 0x88, 0x88, 0xff, 0x88, 0x88, 0x88], AColour); break;
            case 8: this.SetFillPattern([0x18, 0x24, 0x42, 0x81, 0x81, 0x42, 0x24, 0x18], AColour); break;
            case 9: this.SetFillPattern([0xcc, 0x33, 0xcc, 0x33, 0xcc, 0x33, 0xcc, 0x33], AColour); break;
            case 10: this.SetFillPattern([0x80, 0x00, 0x08, 0x00, 0x80, 0x00, 0x08, 0x00], AColour); break;
            case 11: this.SetFillPattern([0x88, 0x00, 0x22, 0x00, 0x88, 0x00, 0x22, 0x00], AColour); break;
        }
        if ((AColour < 0) || (AColour > 15)) {
            //TODO trace("Invalid fill colour: " + AColour);
        } else {
            this._FillSettings.Colour = AColour;
        }
        this._FillSettings.Style = AStyle;
    }

    // Sets the current line width and style.
    // Affects all lines drawn by Line, LineTo, Rectangle, DrawPoly, Arc, and so
    // on.
    // Lines can be drawn solid, dotted, centerline, or dashed. If invalid input is
    // passed to SetLineStyle, GraphResult returns a value of grError, and the
    // current line settings will be unchanged. See Line style constants for a list
    // of constants used to determine line styles.
    // LineStyle is a value from SolidLn to UserBitLn(0..4), Pattern is ignored
    // unless LineStyle equals UserBitLn, and Thickness is NormWidth or ThickWidth.
    // When LineStyle equals UserBitLn, the line is output using the 16-bit pattern
    // defined by the Pattern parameter. For example, if Pattern = $AAAA, then the
    // 16-bit pattern looks like this:
    public static SetLineStyle(AStyle: number, APattern: number, AThickness: number): void {
        this._LineSettings.Style = AStyle;
        switch (AStyle) {
            case 0: this._LineSettings.Pattern = 0xFFFF; break;
            case 1: this._LineSettings.Pattern = 0x3333; break;
            case 2: this._LineSettings.Pattern = 0x1E3F; break;
            case 3: this._LineSettings.Pattern = 0x1F1F; break;
            case 4: this._LineSettings.Pattern = APattern; break;
        }
        this._LineSettings.Thickness = AThickness;
    }

    // Changes one palette color as specified by ColorNum and Color.
    // Changes the ColorNum entry in the palette to Color. SetPalette(0, LightCyan)
    // makes the first color in the palette light cyan. ColorNum can range from 0
    // to 15, depending on the current graphics driver and current graphics mode.
    // If invalid input is passed to SetPalette, GraphResult returns a value of
    // grError, and the palette remains unchanged.
    // Changes made to the palette are seen immediately onscreen. In the example
    // here, several lines are drawn onscreen, then the palette is changed
    // randomly. Each time a palette color is changed, all onscreen occurrences of
    // that color will be changed to the new color value. See Color constants for a
    // list of defined color constants.
    public static SetPalette(ACurrentPaletteIndex: number, AEGAPaletteIndex: number, AUpdateScreen: Boolean = true): void {
        if (this.CURRENT_PALETTE[ACurrentPaletteIndex] != this.EGA_PALETTE[AEGAPaletteIndex]) {
            // Indicate that we need to repaint
            this._Dirty = DirtyType.Pixel;

            // Update the screen if requested
            if (AUpdateScreen) {
                var OldColour: number = this.CURRENT_PALETTE[ACurrentPaletteIndex];
                var NewColour: number = this.EGA_PALETTE[AEGAPaletteIndex];

                var Pixelslength: number = this._Pixels.length
					for (var i: number = 0; i < Pixelslength; i++) {
                    if (this._Pixels[i] == OldColour) {
                        this._Pixels[i] = NewColour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(i, NewColour); 
                    }
                }
            }

            this.CURRENT_PALETTE[ACurrentPaletteIndex] = this.EGA_PALETTE[AEGAPaletteIndex];
        }
    }

    // Sets text justification values used by OutText and OutTextXY.
    // Text output after a SetTextJustify will be justified around the current
    // pointer in the manner specified. Given the following,
    // SetTextJustify(CenterText, CenterText);
    // OutTextXY(100, 100, 'ABC');
    // the point (100, 100) will appear in the middle of the letter B. The default
    // justification settings can be restored by SetTextJustify(LeftText, TopText).
    // If invalid input is passed to SetTextJustify, GraphResult returns a value of
    // grError, and the current text justification settings will be unchanged.
    public static SetTextJustify(AHorizontal: number, AVertical: number): void {
        this._TextSettings.HorizontalAlign = AHorizontal;
        this._TextSettings.VerticalAlign = AVertical;
    }

    // Sets style for text output in graphics mode.
    // Sets the current text font, style, and character magnification factor
    public static SetTextStyle(AFont: number, ADirection: number, ASize: number): void {
        this._TextSettings.Font = AFont;
        this._TextSettings.Direction = ADirection;
        this._TextSettings.Size = ASize;
        this._TextSettings.SetStrokeScale();
    }

    // Sets the current output viewport or window for crt output
    public static SetTextWindow(AX1: number, AY1: number, AX2: number, AY2: number, AWrap: number, ASize: number): void {
        if ((AX1 == 0) && (AY1 == 0) && (AX2 == 0) && (AY2 == 0)) {
            // Disable crt window
            Crt.Canvas.alpha = 0;
        } else if ((AX2 == 0) || (AY2 == 0)) {
            // Sanity check, do nothing if either of those values are 0
            Crt.Canvas.alpha = 0;
        } else if ((AX1 > AX2) || (AY1 > AY2)) {
            // More sanity checking, do nothing in this case
        } else {
            if ((AX1 == this._TextWindow.left) && (AY1 == this._TextWindow.top) && (AX2 == this._TextWindow.right) && (AY2 == this._TextWindow.bottom) && (ASize == this._TextSettings.Size)) {
                // Provided same settings, so only update the wrap
                Crt.AutoWrap = (AWrap != 0);
            } else {
                // Provided some new settings, so update everything
                Crt.AutoWrap = (AWrap != 0)
					Crt.SetScreenSize(AX2 - AX1 + 1, AY2 - AY1 + 1);
                switch (ASize) {
                    case 0:
                        Crt.Canvas.x = AX1 * 8;
                        Crt.Canvas.y = AY1 * 8;
                        Crt.SetFont("RIP", 8, 8);
                        break;
                    case 1:
                        Crt.Canvas.x = AX1 * 7;
                        Crt.Canvas.y = AY1 * 8;
                        Crt.SetFont("RIP", 7, 8);
                        break;
                    case 2:
                        Crt.Canvas.x = AX1 * 8;
                        Crt.Canvas.y = AY1 * 14;
                        Crt.SetFont("RIP", 8, 14);
                        break;
                    case 3:
                        Crt.Canvas.x = AX1 * 7;
                        Crt.Canvas.y = AY1 * 14;
                        Crt.SetFont("RIP", 7, 14);
                        break;
                    case 4:
                        Crt.Canvas.x = AX1 * 16;
                        Crt.Canvas.y = AY1 * 14;
                        Crt.SetFont("RIP", 16, 14);
                        break;
                }
                Crt.TextAttr = 15;
                Crt.ClrScr();
                Crt.Canvas.alpha = 1;
            }
        }
    }

    // Sets the current output viewport or window for graphics output
    // (X1, Y1) define the upper left corner of the viewport, and (X2, Y2) define
    // the lower right corner (0 <= X1 < X2 and 0 <= Y1 < Y2). The upper left
    // corner of a viewport is (0, 0).
    // The Boolean parameter Clip determines whether drawings are clipped at the
    // current viewport boundaries. SetViewPort(0, 0, GetMaxX, GetMaxY, True)
    // always sets the viewport to the entire graphics screen. If invalid input is
    // passed to SetViewPort, GraphResult returns grError, and the current view
    // settings will be unchanged.
    // All graphics commands (for example, GetX, OutText, Rectangle, MoveTo, and so
    // on) are viewport-relative. In the following example, the coordinates of the
    // dot in the middle are relative to the boundaries of the viewport.
    // If the Boolean parameter Clip is set to True when a call to SetViewPort is
    // made, all drawings will be clipped to the current viewport. Note that the
    // current pointer is never clipped. The following will not draw the complete
    // line requested because the line will be clipped to the current viewport:
    public static SetViewPort(AX1: number, AY1: number, AX2: number, AY2: number, AClip: boolean): void {
        if ((AX1 < 0) || (AX1 > AX2)) return;
        if ((AY1 < 0) || (AY1 > AY2)) return;
        if (AX2 > (this.PIXELS_X - 1)) return;
        if (AY2 > (this.PIXELS_Y - 1)) return;

        this._ViewPortSettings.x1 = AX1;
        this._ViewPortSettings.y1 = AY1;
        this._ViewPortSettings.x2 = AX2;
        this._ViewPortSettings.y2 = AY2;
        this._ViewPortSettings.Clip = AClip;

        this._ViewPortSettings.FromBottom = (this.PIXELS_Y - 1) - AY2;
        this._ViewPortSettings.FromLeft = AX1;
        this._ViewPortSettings.FromRight = (this.PIXELS_X - 1) - AX2;
        this._ViewPortSettings.FromTop = AY1;
        this._ViewPortSettings.FullScreen = ((AX1 == 0) && (AY1 == 0) && (AX2 == (this.PIXELS_X - 1)) && (AY2 == (this.PIXELS_Y - 1)));
    }

    // Sets the writing mode for line drawing.
    // Each binary operation constant corresponds to a binary operation between
    // each byte in the line and the corresponding bytes on the screen. CopyPut
    // uses the assembly language MOV instruction, overwriting with the line
    // whatever is on the screen. XORPut uses the XOR command to combine the line
    // with the screen. Two successive XOR commands will erase the line and restore
    // the screen to its original appearance.
    // SetWriteMode affects calls to the following routines only: DrawPoly, Line,
    // LineRel, LineTo, and Rectangle.
    public static SetWriteMode(AMode: number): void {
        if (AMode != WriteMode.Normal) {
            //TODO trace("SetWriteMode() only supports normal write mode");
            AMode = WriteMode.Normal;
        }
        this._WriteMode = AMode;

        //TODO FPC Says this is how it works:
        //Case writemode of
        //xorput, andput: CurrentWriteMode := XorPut;
        //notput, orput, copyput: CurrentWriteMode := CopyPut;
        //End;

    }

    // Returns the height of a string, in pixels.
    // Takes the current font size and multiplication factor, and determines the
    // height of TextString in pixels. This is useful for adjusting the spacing
    // between lines, computing viewport heights, sizing a title to make it fit on
    // a graph or in a box, and more.
    // For example, with the 8x8 bit-mapped font and a multiplication factor of 1
    // (set by SetTextStyle), the string Turbo is 8 pixels high.
    // It is important to use TextHeight to compute the height of strings, instead
    // of doing the computation manually. In that way, no source code modifications
    // have to be made when different fonts are selected.
    public static TextHeight(AText: string): number {
        if (this._TextSettings.Font == 0) {
            return this._TextSettings.Size * 8;
        } else {
            return StrokeFont.Heights[this._TextSettings.Font - 1] * this._TextSettings.StrokeScaleY;
        }
    }

    public static TextWidth(AText: string): number {
        var ATextlength: number = AText.length;

        if (this._TextSettings.Font == 0) {
            return ATextlength * (this._TextSettings.Size * 8);
        } else {
            var Result: number = 0;
            for (var i: number = 0; i < ATextlength; i++) {
                var Strokes: Array = StrokeFont.Strokes[this._TextSettings.Font - 1][AText.charCodeAt(i)];
                Result += Math.floor(Strokes[0] * this._TextSettings.StrokeScaleX);
            }
            return Result;
        }
    }
}