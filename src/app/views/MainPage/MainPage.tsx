import React from 'react';
import Chokidar, {FSWatcher} from 'chokidar';
import './MainPage.scss';
import {parseCsvToFirstRowAsObject} from "../../model/CsvParser";
import {IDistancesGenerator} from "../../model/DistancesGenerator";
import {ShotsSvg} from "../../components/ShotsSvg/ShotsSvg";
import {computeAbsoluteDeviation, computeRelativeDeviation, IShotData} from "../../model/ShotData";
import {LastShotData} from "../../components/LastShotData/LastShotData";
import {assert} from "chai";
import {NextDistanceBox} from "../../components/NextDistanceBox/NextDistanceBox";
import settingsIcon from '../../../assets/settings.png';
import {RestartButton} from "../../components/RestartButton/RestartButton";
import * as math from 'mathjs'
import {Unit} from 'mathjs'
import {AverageShotsGroundTypeEnum, IAverageShots} from "../../model/AverageShots";

interface IMainPageProps {
    lastShotCsvPath: string;
    averageShotsMap: Map<AverageShotsGroundTypeEnum, IAverageShots>;
    selectedDistancesGenerator: IDistancesGenerator;
    numberOfShots: number;
    handleSettingsClicked: () => void;
}

export const MainPage: React.FC<IMainPageProps> = (props: IMainPageProps): JSX.Element => {
    console.log("averageShotsMap", props.averageShotsMap);
    assert(!!props, "!props");
    assert(!!props.selectedDistancesGenerator, "!props.selectedDistancesGenerator");
    assert(!!props.handleSettingsClicked, "!props.handleSettingsClicked");

    const [shotData, setShotData] = React.useState<IShotData | undefined>();
    const [shotDatas, setShotDatas] = React.useState<IShotData[]>([]);

    const [nextDistance, setNextDistance] = React.useState<Unit>(props.selectedDistancesGenerator.getNext(shotDatas.length));
    const nextDistanceRef: React.MutableRefObject<Unit> = React.useRef<Unit>(nextDistance);

    const lastShotFileChanged = async (): Promise<void> => {
        const lastShotData: any = await parseCsvToFirstRowAsObject(props.lastShotCsvPath);
        const shotIdFromLastShotFile: number = lastShotData["shot_id"];
        if (!!shotIdFromLastShotFile) {
            console.log(`shot id=${shotIdFromLastShotFile} has been executed`);
            setShotData({
                id: shotIdFromLastShotFile,
                carry: math.unit(lastShotData["carry_m"], "m"),
                totalDistance: math.unit(lastShotData["total_distance_m"], "m"),
                offline: math.unit(lastShotData["offline_m"], "m"),
                targetDistance: nextDistanceRef.current
            });
        }
    }

    React.useEffect((): void => {
        console.log("startWatcher");
        const watcher: FSWatcher = Chokidar.watch(
            props.lastShotCsvPath,
            {
                ignored: /[\/\\]\./,
                ignoreInitial: true,
                persistent: true
            });
        watcher
            .on('add', (path: string): void => {
                console.log('File', path, 'has been added');
                lastShotFileChanged();
            })
            .on('addDir', (path: string): void => {
                console.log('Directory', path, 'has been added');
            })
            .on('change', (path: string): void => {
                console.log('File', path, 'has been changed');
                lastShotFileChanged();
            })
            .on('unlink', function (path: string): void {
                console.log('File', path, 'has been removed');
            })
            .on('unlinkDir', function (path: string): void {
                console.log('Directory', path, 'has been removed');
            })
            .on('error', function (error: Error): void {
                console.log('Error happened', error);
            })
            .on('ready', (): void => {
                console.info('From here can you check for real changes, the initial scan has been completed.');
            })
            .on('raw', function (event: string, path: string, details: any): void {
                // This event should be triggered everytime something happens.
                console.log('Raw event info:', event, path, details);
            });

    }, [props.lastShotCsvPath])

    React.useEffect((): void => {
        if (!!shotData && (shotDatas.length === 0 || shotData.id !== shotDatas[shotDatas.length - 1].id)) {
            // new shot detected

            if (shotDatas.length >= props.numberOfShots) {
                // shot executed but number of shots was already reached -> ignore
                console.log(`shot id=${shotData.id} executed but number of shots was already reached -> ignore`);
            } else {
                // add new shot to array
                const shotDatasClone: IShotData[] = [...shotDatas];
                shotDatasClone.push(shotData);
                setShotDatas(shotDatasClone);

                // pick new distance for next shot
                if (shotDatasClone.length < props.numberOfShots) {
                    nextDistanceRef.current = props.selectedDistancesGenerator.getNext(shotDatasClone.length);
                } else {
                    console.log("all shots executed");
                    nextDistanceRef.current = undefined;
                }
                setNextDistance(nextDistanceRef.current);
            }
        }
    }, [shotData]);

    const restart = (): void => {
        props.selectedDistancesGenerator.reset();
        setShotDatas([]);
        nextDistanceRef.current = (props.selectedDistancesGenerator).getNext(0);
        setNextDistance(nextDistanceRef.current);
    }

    const lastShot: IShotData | undefined = shotDatas.length > 0 ? shotDatas[shotDatas.length - 1] : undefined;
    const svgNumberOfCircles: number = 5;

    const absoluteDeviation: Unit | undefined = shotDatas.length > 0 ? computeAbsoluteDeviation(shotDatas[shotDatas.length - 1]) : undefined;
    const relativeDeviation: number | undefined = shotDatas.length > 0 ? computeRelativeDeviation(shotDatas[shotDatas.length - 1]) : undefined;

    const absoluteDeviationSum: Unit = shotDatas
        .map((shotData: IShotData) => computeAbsoluteDeviation(shotData))
        .reduce((accumulator: Unit, currentValue: Unit) => math.add(accumulator, currentValue) as Unit, math.unit(0, props.selectedDistancesGenerator.getUnit()));
    const absoluteDeviationMax: Unit =
        shotDatas
            .map((shotData: IShotData) => computeAbsoluteDeviation(shotData))
            .reduce((accumulator: Unit, currentValue: Unit) => accumulator > currentValue
                ? accumulator
                : currentValue,
                math.unit(0, props.selectedDistancesGenerator.getUnit()))
    ;
    const relativeDeviationSum: number = shotDatas
        .map((shotData: IShotData) => computeRelativeDeviation(shotData))
        .reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0) * 100;


    console.log("shotDatas", shotDatas)

    return (
        <div className="main-page page">
            <div className="next-shot-flex-item flex-item">
                <div className="page-header">
                    <h3>Next</h3>
                </div>
                <div className="NextDistanceBox">
                    <NextDistanceBox
                        nextDistance={nextDistance}
                        selectedDistancesGenerator={props.selectedDistancesGenerator}
                        averageShotsMap={props.averageShotsMap}
                    />
                </div>
                <div className="RestartButton">
                    <RestartButton
                        handleRestartButtonClicked={restart}
                    />
                </div>
            </div>
            <div className="last-shot-flex-item flex-item">
                <div className="page-header">
                    <h3> Shot {shotDatas.length} / {props.numberOfShots} </h3>
                </div>
                <div className="LastShotData">
                    <LastShotData
                        lastShot={lastShot}
                        absoluteDeviation={absoluteDeviation}
                        relativeDeviation={relativeDeviation}
                        absoluteDeviationSum={absoluteDeviationSum}
                        shotDatas={shotDatas}
                        relativeDeviationSum={relativeDeviationSum}
                        unit={props.selectedDistancesGenerator.getUnit()}
                    />
                </div>
            </div>
            <div className="shots-flex-item flex-item">
                <div className="page-header">
                    <h3>All Shots</h3>
                </div>
                <div className="ShotsSvg">
                    <ShotsSvg
                        svgNumberOfCircles={svgNumberOfCircles}
                        absoluteDeviationMax={absoluteDeviationMax}
                        shotDatas={shotDatas}
                        unit={props.selectedDistancesGenerator.getUnit()}
                    />
                </div>
            </div>
            <div className="page-change-flex-item flex-item">
                            <span className="page-change-span"
                                  onClick={(): void => {
                                      console.log(props.handleSettingsClicked())
                                  }}>
                <img className="page-change-img"
                     src={settingsIcon}
                     alt="Settings"
                />
            </span>
            </div>
        </div>
    );
}
