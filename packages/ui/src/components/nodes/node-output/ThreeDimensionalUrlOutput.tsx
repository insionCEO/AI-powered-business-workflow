import React, { useEffect, useRef, useState } from "react";
import { FaDownload } from "react-icons/fa";
import styled from "styled-components";
import { getFileTypeFromUrl, getGeneratedFileName } from "./outputUtils";
import { useTranslation } from "react-i18next";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
} from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { LoadingSpinner } from "../Node.styles";

interface ThreeDimensionalUrlOutputProps {
  url: string;
  name: string;
}

const ThreeDimensionalUrlOutput: React.FC<ThreeDimensionalUrlOutputProps> = ({
  url,
  name,
}) => {
  const { t } = useTranslation("flow");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadObj = (url: string, scene: Scene) => {
    new OBJLoader().load(url, (obj: any) => {
      setIsLoading(false);
      scene.add(obj);
    });
  };

  const loadGlb = (url: string, scene: Scene) => {
    new GLTFLoader().load(url, (gltf: any) => {
      setIsLoading(false);
      scene.add(gltf.scene);
    });
  };

  useEffect(() => {
    setHasError(false);
    const container = containerRef.current;
    if (!container) return;

    const type = getFileTypeFromUrl(url);

    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    const renderer = new WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const ambientLight = new AmbientLight(0xffffff, 1); // soft white light
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    if (type === "obj") loadObj(url, scene);
    else loadGlb(url, scene);

    const controls = new OrbitControls(camera, renderer.domElement);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.clear();
      renderer.render(scene, camera);
    };

    camera.position.z = 5;
    animate();

    return () => {
      controls.dispose();
      renderer.dispose();
      scene.children.forEach((child) => {
        scene.remove(child);
      });
      scene.remove();
    };
  }, [url]);

  const handleDownloadClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const link = document.createElement("a");
    link.href = url;
    link.download = getGeneratedFileName(url, name);
    link.target = "_blank";
    link.click();
  };

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setHasError(false);
  };

  return (
    <OutputContainer>
      {hasError ? (
        <p className="text-center"> {t("ExpiredURL")}</p>
      ) : (
        <>
          {isLoading ? (
            <LoadingSpinner className="absolute w-full text-4xl" />
          ) : null}
          <div
            className={`three-container flex h-full w-full`}
            ref={containerRef}
            key={url}
            onClick={(e) => e.stopPropagation()}
          />
          {}
          <div
            className="absolute right-3 top-2 rounded-md bg-slate-600/75 px-1 py-1 text-2xl text-slate-100 hover:bg-sky-600/90"
            onClick={handleDownloadClick}
          >
            <FaDownload />
          </div>
        </>
      )}
    </OutputContainer>
  );
};

const OutputContainer = styled.div`
  position: relative;
  align-items: center;
  justify-items: center;
  text-align: center;
  display: flex;
  margin-top: 10px;
  height: 500px;
  width: auto;
`;

export default ThreeDimensionalUrlOutput;
