import {Box, Center, Stack, Text, Button, useMantineTheme} from '@mantine/core';
import {IconFileText} from '@tabler/icons-react';

interface LoadingScreenProps {
    visible: boolean;
    message?: string;
    onAbort?: () => void;
}

const animationStyles = `
  .scene-container {
    width: 200px;
    height: 200px;
    perspective: 800px;
  }

  .cube {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    animation: tumble 12s infinite ease-in-out;
  }

  .cube-face {
    position: absolute;
    width: 200px;
    height: 200px;
    border: 2px solid rgba(66, 153, 225, 0.5);
    background: rgba(66, 153, 225, 0.1);
    box-shadow: 0 0 20px rgba(66, 153, 225, 0.2) inset;
    display: flex;
    align-items: center;
    justify-content: center;
    backface-visibility: visible;
  }

  .cube-face--front  { transform: rotateY(  0deg) translateZ(100px); }
  .cube-face--right  { transform: rotateY( 90deg) translateZ(100px); }
  .cube-face--back   { transform: rotateY(180deg) translateZ(100px); }
  .cube-face--left   { transform: rotateY(-90deg) translateZ(100px); }
  .cube-face--top    { transform: rotateX( 90deg) translateZ(100px); }
  .cube-face--bottom { transform: rotateX(-90deg) translateZ(100px); }

  .icon-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    transform-style: preserve-3d;
    animation: counter-tumble 12s infinite ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-3d {
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));
    transform: translateZ(0); 
  }

  @keyframes tumble {
    0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
    20% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
    40% { transform: rotateX(-90deg) rotateY(180deg) rotateZ(-45deg); }
    60% { transform: rotateX(90deg) rotateY(-90deg) rotateZ(135deg); }
    80% { transform: rotateX(-180deg) rotateY(45deg) rotateZ(-90deg); }
    100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  }

  @keyframes counter-tumble {
    0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
    20% { transform: rotateX(-180deg) rotateY(-90deg) rotateZ(-45deg); }
    40% { transform: rotateX(90deg) rotateY(-180deg) rotateZ(45deg); }
    60% { transform: rotateX(-90deg) rotateY(90deg) rotateZ(-135deg); }
    80% { transform: rotateX(180deg) rotateY(-45deg) rotateZ(90deg); }
    100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  }
`;

export const LoadingScreen = ({visible, message, onAbort}: LoadingScreenProps) => {
    const theme = useMantineTheme();

    if (!visible) return null;

    return (
        <>
            <style>{animationStyles}</style>
            <Box
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Center h="100%">
                    <Stack align="center" gap="xl">
                        <div className="scene-container">
                            <div className="cube">
                                <div className="cube-face cube-face--front" />
                                <div className="cube-face cube-face--back" />
                                <div className="cube-face cube-face--right" />
                                <div className="cube-face cube-face--left" />
                                <div className="cube-face cube-face--top" />
                                <div className="cube-face cube-face--bottom" />

                                <div className="icon-wrapper">
                                    <div className="icon-3d" style={{color: theme.colors.blue[4]}}>
                                        <IconFileText size={80} stroke={1.5}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Stack align="center" gap="md">
                            {message && (
                                <Text
                                    c="white"
                                    fw={600}
                                    size="xl"
                                    style={{
                                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                        letterSpacing: '0.5px',
                                    }}
                                    ta="center"
                                >
                                    {message}
                                </Text>
                            )}

                            {onAbort && (
                                <Button
                                    color="red"
                                    radius="xl"
                                    size="md"
                                    variant="light"
                                    onClick={onAbort}
                                >
                                    Abort
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Center>
            </Box>
        </>
    );
};