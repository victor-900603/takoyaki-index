// 取自 dkaoster/taiwan-atlas (MIT License) 的 mercatorTw 複合投影。
// 將台灣本島與澎湖、金門、連江、烏坵分別投影後拼接，避免離島把本島縮得太小。
import { geoStream, geoMercator } from "d3-geo";
import { path } from "d3-path";

const epsilon = 1e-6;

function noop() {}

let x0 = Infinity;
let y0 = x0;
let x1 = -x0;
let y1 = x1;

function boundsPoint(x: number, y: number) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
}

const boundsStream = {
    point: boundsPoint,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
    result() {
        const bounds = [
            [x0, y0],
            [x1, y1],
        ];
        x1 = y1 = -(y0 = x0 = Infinity);
        return bounds;
    },
};

function fitExtent(projection: any, extent: number[][], object: any) {
    const w = extent[1][0] - extent[0][0];
    const h = extent[1][1] - extent[0][1];
    const clip = projection.clipExtent && projection.clipExtent();

    projection.scale(150).translate([0, 0]);

    if (clip != null) projection.clipExtent(null);

    geoStream(object, projection.stream(boundsStream));

    const b = boundsStream.result();
    const k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1]));
    const x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2;
    const y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;

    if (clip != null) projection.clipExtent(clip);

    return projection.scale(k * 150).translate([x, y]);
}

function fitSize(projection: any, size: number[], object: any) {
    return fitExtent(projection, [[0, 0], size], object);
}

const defaultScale = 10000;
const defaultCenter = [275, 300];

const geoCoordinates: Record<
    string,
    { width: number; height: number; offsetX: number; offsetY: number }
> = {
    mainland: { width: 360, height: 600, offsetX: 0, offsetY: 0 },
    penghu: { width: 90, height: 130, offsetX: -210, offsetY: 200 },
    kinmen: { width: 120, height: 60, offsetX: -195, offsetY: -110 },
    lienchiang: { width: 120, height: 120, offsetX: -195, offsetY: -220 },
    wuqiu: { width: 30, height: 30, offsetX: -150, offsetY: -125 },
};

function multiplex(streams: any[]) {
    const n = streams.length;
    return {
        point(x: number, y: number) {
            let i = -1;
            while (++i < n) streams[i].point(x, y);
        },
        sphere() {
            let i = -1;
            while (++i < n) streams[i].sphere();
        },
        lineStart() {
            let i = -1;
            while (++i < n) streams[i].lineStart();
        },
        lineEnd() {
            let i = -1;
            while (++i < n) streams[i].lineEnd();
        },
        polygonStart() {
            let i = -1;
            while (++i < n) streams[i].polygonStart();
        },
        polygonEnd() {
            let i = -1;
            while (++i < n) streams[i].polygonEnd();
        },
    };
}

// A composite projection for Taiwan, configured by default for 450x600.
const mercatorTw: any = () => {
    let cache: any;
    let cacheStream: any;

    const mainland: any = geoMercator().rotate([-120.97, -23.6]);
    let mainlandPoint: any;
    const penghu: any = geoMercator().rotate([-119.53, -23.47]);
    let penghuPoint: any;
    const kinmen: any = geoMercator().rotate([-118.38, -24.44]);
    let kinmenPoint: any;
    const lienchiang: any = geoMercator().rotate([-120.22, -26.16]);
    let lienchiangPoint: any;
    const wuqiu: any = geoMercator().rotate([-119.45, -24.98]);
    let wuqiuPoint: any;

    let point: number[] | null;
    const pointStream: any = {
        point(x: number, y: number) {
            point = [x, y];
        },
    };

    const project = (coordinates: number[]) => {
        const x = coordinates[0];
        const y = coordinates[1];
        point = null;
        return (
            (mainlandPoint.point(x, y), point) ||
            (penghuPoint.point(x, y), point) ||
            (kinmenPoint.point(x, y), point) ||
            (lienchiangPoint.point(x, y), point) ||
            (wuqiuPoint.point(x, y), point)
        );
    };

    const reset = () => {
        cache = null;
        cacheStream = null;
        return project;
    };

    project.invert = (coordinates: number[]) => {
        const k = mainland.scale();
        const t = mainland.translate();
        const x = (coordinates[0] - t[0]) / k;
        const y = (coordinates[1] - t[1]) / k;

        const isInBounds = (obj: (typeof geoCoordinates)[string]) =>
            y >= (obj.offsetY - obj.height / 2) / defaultScale &&
            y < (obj.offsetY + obj.height / 2) / defaultScale &&
            x >= (obj.offsetX - obj.width / 2) / defaultScale &&
            x < (obj.offsetX + obj.width / 2) / defaultScale;

        if (isInBounds(geoCoordinates.wuqiu)) return wuqiu.invert(coordinates);
        if (isInBounds(geoCoordinates.kinmen)) return kinmen.invert(coordinates);
        if (isInBounds(geoCoordinates.lienchiang))
            return lienchiang.invert(coordinates);
        if (isInBounds(geoCoordinates.penghu)) return penghu.invert(coordinates);

        return mainland.invert(coordinates);
    };

    project.stream = (stream: any) =>
        cache && cacheStream === stream
            ? cache
            : (cache = multiplex([
                  mainland.stream((cacheStream = stream)),
                  penghu.stream(stream),
                  kinmen.stream(stream),
                  lienchiang.stream(stream),
                  wuqiu.stream(stream),
              ]));

    project.precision = (...args: any[]) => {
        if (!args.length) return mainland.precision();
        mainland.precision(args[0]);
        penghu.precision(args[0]);
        kinmen.precision(args[0]);
        lienchiang.precision(args[0]);
        wuqiu.precision(args[0]);
        return reset();
    };

    project.scale = (...args: any[]) => {
        if (!args.length) return mainland.scale();
        mainland.scale(args[0]);
        penghu.scale(args[0]);
        kinmen.scale(args[0]);
        lienchiang.scale(args[0]);
        wuqiu.scale(args[0]);
        return project.translate(mainland.translate());
    };

    project.translate = (...args: any[]) => {
        if (!args.length) return mainland.translate();
        const k = mainland.scale();
        const x = +args[0][0];
        const y = +args[0][1];

        const genTranslate = (obj: (typeof geoCoordinates)[string]) => [
            x + (obj.offsetX / defaultScale) * k,
            y + (obj.offsetY / defaultScale) * k,
        ];

        const genClipExtent = (obj: (typeof geoCoordinates)[string]) => [
            [
                x - ((obj.width / 2 - obj.offsetX) / defaultScale) * k + epsilon,
                y -
                    ((obj.height / 2 - obj.offsetY) / defaultScale) * k +
                    epsilon,
            ],
            [
                x + ((obj.width / 2 + obj.offsetX) / defaultScale) * k - epsilon,
                y +
                    ((obj.height / 2 + obj.offsetY) / defaultScale) * k -
                    epsilon,
            ],
        ];

        mainlandPoint = mainland
            .translate(genTranslate(geoCoordinates.mainland))
            .clipExtent(genClipExtent(geoCoordinates.mainland))
            .stream(pointStream);

        penghuPoint = penghu
            .translate(genTranslate(geoCoordinates.penghu))
            .clipExtent(genClipExtent(geoCoordinates.penghu))
            .stream(pointStream);

        kinmenPoint = kinmen
            .translate(genTranslate(geoCoordinates.kinmen))
            .clipExtent(genClipExtent(geoCoordinates.kinmen))
            .stream(pointStream);

        lienchiangPoint = lienchiang
            .translate(genTranslate(geoCoordinates.lienchiang))
            .clipExtent(genClipExtent(geoCoordinates.lienchiang))
            .stream(pointStream);

        wuqiuPoint = wuqiu
            .translate(genTranslate(geoCoordinates.wuqiu))
            .clipExtent(genClipExtent(geoCoordinates.wuqiu))
            .stream(pointStream);

        return reset();
    };

    project.fitExtent = (extent: number[][], object: any) =>
        fitExtent(project, extent, object);
    project.fitSize = (size: number[], object: any) =>
        fitSize(project, size, object);

    project.compositionBorderPoints = () => {
        const k = mainland.scale();
        const t = mainland.translate();
        const x = t[0];
        const y = t[1];

        const points = (areaKey: string) => {
            const areaCenterX = geoCoordinates[areaKey].offsetX;
            const areaCenterY = geoCoordinates[areaKey].offsetY;
            const dx = geoCoordinates[areaKey].width / 2;
            const dy = geoCoordinates[areaKey].height / 2;
            return [
                [
                    x + ((areaCenterX - dx) / defaultScale) * k,
                    y + ((areaCenterY - dy) / defaultScale) * k,
                ],
                [
                    x + ((areaCenterX + dx) / defaultScale) * k,
                    y + ((areaCenterY - dy) / defaultScale) * k,
                ],
                [
                    x + ((areaCenterX + dx) / defaultScale) * k,
                    y + ((areaCenterY + dy) / defaultScale) * k,
                ],
                [
                    x + ((areaCenterX - dx) / defaultScale) * k,
                    y + ((areaCenterY + dy) / defaultScale) * k,
                ],
            ];
        };

        return ["penghu", "lienchiang", "kinmen", "wuqiu"].map((areaKey) => {
            const areaPoints = points(areaKey);

            if (areaKey === "kinmen") {
                const wuqiuPoints = points("wuqiu");
                return {
                    name: areaKey,
                    coords: [
                        areaPoints[0],
                        wuqiuPoints[0],
                        wuqiuPoints[3],
                        wuqiuPoints[2],
                        areaPoints[2],
                        areaPoints[3],
                        areaPoints[0],
                    ],
                };
            }
            return {
                name: areaKey,
                coords: [...areaPoints, areaPoints[0]],
            };
        });
    };

    project.drawCompositionBorders = (context: any) => {
        project.compositionBorderPoints().forEach((areaBorder: any) => {
            areaBorder.coords.forEach((coords: number[], i: number) => {
                if (i === 0) context.moveTo(...coords);
                else context.lineTo(...coords);
            });
        });
    };

    project.getCompositionBorders = () => {
        const context = path();
        project.drawCompositionBorders(context);
        return context.toString();
    };

    return project.scale(defaultScale).translate(defaultCenter);
};

export default mercatorTw;
