import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Full-viewport WebGL neural-network canvas (Three.js upgrade).
 *
 * Replaces the previous Canvas-2D version with a WebGL renderer:
 *  - 70 drifting nodes in true 3-D space
 *  - Distance-based line segments rebuilt every frame
 *  - Mouse-parallax tilts the whole scene smoothly
 *  - Gracefully skips animation when `prefers-reduced-motion` is set
 *  - Properly disposes every GPU resource on unmount
 *
 * Drop-in replacement — same class name, same Tailwind classes.
 * Sits fixed behind all content via `fixed inset-0 -z-10`.
 */
export function NeuralCanvas(): React.JSX.Element {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect((): (() => void) => {
    const mount = mountRef.current;
    if (!mount) return (): void => undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      800,
    );
    camera.position.z = 90;

    // ── Nodes (small dark spheres) ───────────────────────────────────────────
    const NODE_COUNT = 70;
    const SPREAD = 65;
    const CONNECT_DIST = 22;

    type NodeData = { mesh: THREE.Mesh; vel: THREE.Vector3 };

    const nodeGeo = new THREE.SphereGeometry(0.35, 5, 5);
    const nodeMats: THREE.MeshBasicMaterial[] = [];
    const nodes: NodeData[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.45 + Math.random() * 0.25,
      });
      nodeMats.push(mat);

      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * SPREAD * 2.5,
        (Math.random() - 0.5) * SPREAD,
        (Math.random() - 0.5) * SPREAD * 0.7,
      );
      scene.add(mesh);

      nodes.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.033,
          (Math.random() - 0.5) * 0.033,
          (Math.random() - 0.5) * 0.016,
        ),
      });
    }

    // ── Line segments (rebuilt each frame) ──────────────────────────────────
    // Worst-case: every pair connects → n*(n-1)/2 segments → *2 points → *3 floats
    const posArr = new Float32Array(NODE_COUNT * NODE_COUNT * 6);
    const posAttr = new THREE.BufferAttribute(posArr, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', posAttr);
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x1a1a1a,
      transparent: true,
      opacity: 0.07,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── Mouse parallax ───────────────────────────────────────────────────────
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseMove = (e: MouseEvent): void => {
      targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.45;
      targetRotX = -(e.clientY / window.innerHeight - 0.5) * 0.22;
    };

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = (): void => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    if (!reduced) window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    // ── Render loop ──────────────────────────────────────────────────────────
    let rafId: number;

    const tick = (): void => {
      rafId = requestAnimationFrame(tick);

      if (!reduced) {
        // Drift nodes, bounce off invisible walls
        nodes.forEach(({ mesh, vel }) => {
          mesh.position.add(vel);
          if (Math.abs(mesh.position.x) > SPREAD * 1.25) vel.x *= -1;
          if (Math.abs(mesh.position.y) > SPREAD * 0.5) vel.y *= -1;
          if (Math.abs(mesh.position.z) > SPREAD * 0.35) vel.z *= -1;
        });

        // Rebuild connections for nearby pairs
        let idx = 0;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const d = nodes[i].mesh.position.distanceTo(nodes[j].mesh.position);
            if (d < CONNECT_DIST) {
              const a = nodes[i].mesh.position;
              const b = nodes[j].mesh.position;
              posArr[idx++] = a.x; posArr[idx++] = a.y; posArr[idx++] = a.z;
              posArr[idx++] = b.x; posArr[idx++] = b.y; posArr[idx++] = b.z;
            }
          }
        }
        lineGeo.setDrawRange(0, idx / 3);
        posAttr.needsUpdate = true;

        // Smooth mouse parallax (lerp)
        scene.rotation.y += (targetRotY - scene.rotation.y) * 0.05;
        scene.rotation.x += (targetRotX - scene.rotation.x) * 0.05;
      }

      renderer.render(scene, camera);
    };

    tick();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return (): void => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      nodeGeo.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      nodeMats.forEach((m) => m.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-60"
      aria-hidden="true"
    />
  );
}

export default NeuralCanvas;
